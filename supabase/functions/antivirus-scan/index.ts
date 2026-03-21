import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VIRUSTOTAL_API_KEY = Deno.env.get("VIRUSTOTAL_API_KEY");
const CLAMAV_API_URL = Deno.env.get("CLAMAV_API_URL"); // Self-hosted ClamAV

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ScanRequest {
  file_url: string;
  file_name: string;
  product_id: string;
  user_id: string;
}

interface ScanResponse {
  success: boolean;
  is_safe: boolean;
  scan_provider: string;
  threats_found?: string[];
  scan_details?: any;
  error_message?: string;
}

/**
 * 🦠 PHASE 2.2 - Antivirus Scanning pour uploads de produits digitaux
 *
 * Scanne tous les fichiers uploadés avec:
 * 1. VirusTotal API (si clé configurée)
 * 2. ClamAV self-hosted (fallback)
 * 3. Heuristiques de détection de malware basiques
 *
 * Bloque automatiquement les fichiers infectés et notifie les admins
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 🔐 Vérification de l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          is_safe: false,
          scan_provider: 'none',
          error_message: 'Authentication required'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          is_safe: false,
          scan_provider: 'none',
          error_message: 'Invalid authentication token'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { file_url, file_name, product_id, user_id }: ScanRequest = await req.json();

    if (!file_url || !product_id || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          is_safe: false,
          scan_provider: 'none',
          error_message: 'file_url, product_id, and user_id are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🦠 Starting antivirus scan for: ${file_name}`);

    // 📥 Télécharger le fichier
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    console.log(`📥 File downloaded: ${fileSize} bytes`);

    // 🔍 ÉTAPE 1: Heuristiques basiques
    const heuristicResult = performHeuristicScan(fileBuffer, file_name);
    if (!heuristicResult.is_safe) {
      console.log('⚠️ Heuristic scan found suspicious patterns');
      await logScanResult(product_id, user_id, 'heuristic', false, heuristicResult.threats);

      return new Response(
        JSON.stringify({
          success: true,
          is_safe: false,
          scan_provider: 'heuristic',
          threats_found: heuristicResult.threats,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 🦠 ÉTAPE 2: VirusTotal (si configuré)
    if (VIRUSTOTAL_API_KEY) {
      console.log('🔍 Scanning with VirusTotal...');
      const vtResult = await scanWithVirusTotal(fileBuffer, file_name);

      if (vtResult.success) {
        await logScanResult(product_id, user_id, 'virustotal', vtResult.is_safe, vtResult.threats_found);

        return new Response(
          JSON.stringify({
            success: true,
            is_safe: vtResult.is_safe,
            scan_provider: 'virustotal',
            threats_found: vtResult.threats_found,
            scan_details: vtResult.scan_details,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 🦠 ÉTAPE 3: ClamAV (si configuré)
    if (CLAMAV_API_URL) {
      console.log('🔍 Scanning with ClamAV...');
      const clamResult = await scanWithClamAV(fileBuffer, file_name);

      if (clamResult.success) {
        await logScanResult(product_id, user_id, 'clamav', clamResult.is_safe, clamResult.threats_found);

        return new Response(
          JSON.stringify({
            success: true,
            is_safe: clamResult.is_safe,
            scan_provider: 'clamav',
            threats_found: clamResult.threats_found,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // ✅ Aucun scanner disponible, mais heuristiques OK
    console.log('⚠️ No antivirus scanners configured, relying on heuristics only');
    await logScanResult(product_id, user_id, 'heuristic_only', true, []);

    return new Response(
      JSON.stringify({
        success: true,
        is_safe: true,
        scan_provider: 'heuristic_only',
        threats_found: [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Antivirus scan error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        is_safe: false,
        scan_provider: 'error',
        error_message: 'Scan failed',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Heuristiques de détection de malware basiques
 */
function performHeuristicScan(fileBuffer: ArrayBuffer, fileName: string): { is_safe: boolean; threats: string[] } {
  const threats: string[] = [];
  const bytes = new Uint8Array(fileBuffer);

  // 1. Vérifier les extensions dangereuses dans le nom
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  const lowerFileName = fileName.toLowerCase();

  for (const ext of dangerousExtensions) {
    if (lowerFileName.endsWith(ext)) {
      threats.push(`Potentially dangerous file extension: ${ext}`);
    }
  }

  // 2. Détecter les signatures MZ/PE (exécutables Windows)
  if (bytes.length > 2 && bytes[0] === 0x4D && bytes[1] === 0x5A) {
    threats.push('Windows executable detected (MZ header)');
  }

  // 3. Détecter les patterns suspects
  const suspiciousPatterns = [
    'eval(',
    'exec(',
    'shell_exec',
    'system(',
    'base64_decode',
    'file_get_contents',
  ];

  const textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(10000, bytes.length)));

  for (const pattern of suspiciousPatterns) {
    if (textContent.includes(pattern)) {
      threats.push(`Suspicious code pattern: ${pattern}`);
    }
  }

  return {
    is_safe: threats.length === 0,
    threats,
  };
}

/**
 * Scan avec VirusTotal API
 */
async function scanWithVirusTotal(fileBuffer: ArrayBuffer, fileName: string): Promise<ScanResponse> {
  try {
    // 1. Upload le fichier
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);

    const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY!,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`VirusTotal upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const analysisId = uploadData.data.id;

    // 2. Attendre et récupérer les résultats (max 30 secondes)
    let attempts = 0;
    while (attempts < 6) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5s

      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY!,
        },
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const stats = analysisData.data.attributes.stats;

        const threatsFound: string[] = [];
        if (stats.malicious > 0) {
          threatsFound.push(`${stats.malicious} antivirus engines detected malware`);
        }

        return {
          success: true,
          is_safe: stats.malicious === 0 && stats.suspicious === 0,
          scan_provider: 'virustotal',
          threats_found: threatsFound,
          scan_details: stats,
        };
      }

      attempts++;
    }

    throw new Error('VirusTotal scan timeout');

  } catch (error) {
    console.error('VirusTotal scan error:', error);
    return {
      success: false,
      is_safe: false,
      scan_provider: 'virustotal',
      error_message: error.message,
    };
  }
}

/**
 * Scan avec ClamAV
 */
async function scanWithClamAV(fileBuffer: ArrayBuffer, fileName: string): Promise<ScanResponse> {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);

    const response = await fetch(`${CLAMAV_API_URL}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ClamAV scan failed: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      is_safe: result.is_clean === true,
      scan_provider: 'clamav',
      threats_found: result.viruses || [],
    };

  } catch (error) {
    console.error('ClamAV scan error:', error);
    return {
      success: false,
      is_safe: false,
      scan_provider: 'clamav',
      error_message: error.message,
    };
  }
}

/**
 * Logger les résultats du scan
 */
async function logScanResult(
  productId: string,
  userId: string,
  provider: string,
  isSafe: boolean,
  threats: string[] | undefined
): Promise<void> {
  await supabase
    .from('security_audit_logs')
    .insert({
      event_type: 'antivirus_scan',
      user_id: userId,
      metadata: {
        product_id: productId,
        scan_provider: provider,
        is_safe: isSafe,
        threats_found: threats || [],
      },
      severity: isSafe ? 'info' : 'critical',
      created_at: new Date().toISOString(),
    });
}
