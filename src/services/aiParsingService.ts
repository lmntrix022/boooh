export interface AIParsingResult {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  email?: string;
  emailAlt?: string;  // Nouveau: email alternatif
  phone?: string;
  phoneAlt?: string;  // Nouveau: téléphone alternatif
  website?: string;
  address?: {
    full?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
  };
  confidence: number;
  rawData: {
    rawText: string;
    detectedLanguage?: string;
  };
  suggestions: string[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  boundingBoxes?: Array<{
    text: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

// Callback pour le suivi de progression
export type ProgressCallback = (stage: string, progress: number, detail?: string) => void;

export class AIParsingService {
  private static getEnvVar(key: string): string | undefined {
    // @ts-ignore - Vite environment variables
    return import.meta.env[key];
  }
  
  private static readonly OPENAI_API_KEY = AIParsingService.getEnvVar('VITE_OPENAI_API_KEY');
  private static readonly GOOGLE_VISION_API_KEY = AIParsingService.getEnvVar('VITE_GOOGLE_VISION_API') || AIParsingService.getEnvVar('VITE_GOOGLE_VISION_API_KEY');
  
  // Cache des résultats de scan (évite de re-scanner la même image)
  private static resultCache = new Map<string, { result: AIParsingResult; timestamp: number }>();
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 60 minutes (1h) - Augmenté pour limiter appels API
  
  // Rate limiting : dernier appel OpenAI API (pour éviter 429 en Tier 0)
  private static lastOpenAICall = 0;
  private static readonly MIN_DELAY_OPENAI = 20 * 1000; // 20 secondes (Tier 0 = 3 RPM)

  /**
   * Génère un hash simple pour identifier une image
   */
  private static async generateImageHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 1000)); // Premiers 1000 bytes
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash) + bytes[i];
      hash = hash & hash;
    }
    return `${file.size}-${hash}`;
  }

  /**
   * Compresse une image pour optimiser l'envoi API
   */
  private static async compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        } else {
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Traite une image de carte de visite avec OCR et IA (version améliorée avec progression)
   */
  static async parseBusinessCard(
    imageFile: File, 
    onProgress?: ProgressCallback
  ): Promise<AIParsingResult> {
    const notify = (stage: string, progress: number, detail?: string) => {
      onProgress?.(stage, progress, detail);
    };

    try {
      // Vérifier le cache
      notify('cache', 5, 'Vérification du cache...');
      const imageHash = await this.generateImageHash(imageFile);
      const cached = this.resultCache.get(imageHash);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        notify('cache', 100, 'Résultat trouvé en cache!');
        return cached.result;
      }

      // Étape 1: Compression de l'image
      notify('compression', 10, 'Optimisation de l\'image...');
      const compressedFile = await this.compressImage(imageFile);
      const compressionRatio = ((1 - compressedFile.size / imageFile.size) * 100).toFixed(0);
      notify('compression', 20, `Image compressée (${compressionRatio}% économisé)`);

      // Étape 2: OCR avec Google Vision API (avec retry)
      notify('ocr', 30, 'Reconnaissance du texte (OCR)...');
      const ocrResult = await this.performOCRWithRetry(compressedFile, 2);
      notify('ocr', 60, `Texte détecté (${ocrResult.text.length} caractères)`);
      
      // Étape 3: Parsing IA avec GPT-4 Vision
      notify('parsing', 70, 'Analyse intelligente des données...');
      const aiResult = await this.parseWithGPT4Vision(compressedFile, ocrResult);
      notify('parsing', 85, 'Données extraites avec succès');
      
      // Étape 4: Validation et correction
      notify('validation', 90, 'Validation des informations...');
      const validatedResult = this.validateAndCorrect(aiResult, ocrResult);
      
      // Sauvegarder en cache
      this.resultCache.set(imageHash, { result: validatedResult, timestamp: Date.now() });
      
      // Nettoyer le cache ancien
      this.cleanCache();
      
      notify('complete', 100, 'Scan terminé!');
      return validatedResult;
    } catch (error) {
      notify('error', 0, 'Erreur lors du traitement');
      throw new Error('Impossible de traiter la carte de visite. Veuillez réessayer.');
    }
  }

  /**
   * Nettoie les entrées de cache expirées
   */
  private static cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.resultCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.resultCache.delete(key);
      }
    }
  }

  /**
   * OCR avec retry automatique
   */
  private static async performOCRWithRetry(imageFile: File, maxRetries: number): Promise<OCRResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.performOCR(imageFile);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Attendre avant de réessayer (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
        }
      }
    }
    
    throw lastError || new Error('OCR failed after retries');
  }

  /**
   * Effectue l'OCR avec Google Vision API (avec timeout de 10s)
   */
  private static async performOCR(imageFile: File): Promise<OCRResult> {
    // Option : Forcer Tesseract.js si Google Vision pose problème
    // Décommenter la ligne ci-dessous pour bypass Google Vision :
    // return await this.performBasicOCR(imageFile);
    
    if (!this.GOOGLE_VISION_API_KEY) {
      console.warn('⚠️ Google Vision API key non trouvée, utilisation de Tesseract.js');
      // Fallback: OCR basique avec Tesseract.js
      return await this.performBasicOCR(imageFile);
    }

    console.log('🔍 Démarrage Google Vision API OCR...');
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      // Créer une promesse de timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Google Vision API timeout (10s)')), 10000);
      });
      
      // Exécuter fetch avec timeout de 10 secondes
      const fetchPromise = fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image.split(',')[1], // Remove data:image/...;base64, prefix
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
                imageContext: {
                  languageHints: ['fr', 'en', 'es', 'de', 'it'], // Langues supportées
                },
              },
            ],
          }),
        }
      );
      
      // Race entre fetch et timeout (si timeout gagne, lance erreur)
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('✅ Google Vision API réponse reçue');

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations || [];
      
      if (textAnnotations.length === 0) {
        throw new Error('Aucun texte détecté dans l\'image');
      }

      const fullText = textAnnotations[0].description || '';
      const confidence = this.calculateConfidenceFromAnnotations(textAnnotations);
      const language = this.detectLanguage(fullText);
      
      console.log(`✅ OCR terminé - ${fullText.length} caractères détectés (confiance: ${Math.round(confidence * 100)}%)`);

      return {
        text: fullText,
        confidence,
        language,
        boundingBoxes: textAnnotations.slice(1).map((annotation: any) => ({
          text: annotation.description,
          confidence: 0.9, // Google Vision ne fournit pas de confidence par mot
          x: annotation.boundingPoly.vertices[0].x,
          y: annotation.boundingPoly.vertices[0].y,
          width: annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x,
          height: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y,
        })),
      };
    } catch (error) {
      console.warn('⚠️ Google Vision API échec:', error);
      console.log('🔄 Fallback vers Tesseract.js...');
      return await this.performBasicOCR(imageFile);
    }
  }

  // Cache du worker Tesseract pour éviter de le recharger à chaque scan
  private static tesseractWorker: any = null;
  private static isWorkerInitializing = false;

  /**
   * Initialise ou récupère le worker Tesseract (singleton)
   */
  private static async getTesseractWorker(): Promise<any> {
    if (this.tesseractWorker) {
      return this.tesseractWorker;
    }

    // Éviter les initialisations parallèles
    if (this.isWorkerInitializing) {
      // Attendre que l'initialisation en cours se termine
      while (this.isWorkerInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.tesseractWorker;
    }

    this.isWorkerInitializing = true;

    try {
      const Tesseract = await import('tesseract.js');
      
      // Créer un worker optimisé
      this.tesseractWorker = await Tesseract.createWorker('fra+eng', 1, {
        // Utiliser le CDN jsdelivr pour les fichiers de langue (plus rapide)
        langPath: 'https://cdn.jsdelivr.net/npm/@aspect14/tesseract-fast-data/4.0.0_best',
        // Désactiver les logs pour plus de performance
        logger: () => {},
        // Optimisations
        errorHandler: (err: any) => console.error('Tesseract error:', err),
      });

      return this.tesseractWorker;
    } finally {
      this.isWorkerInitializing = false;
    }
  }

  /**
   * OCR basique avec Tesseract.js (fallback) - Version optimisée
   */
  private static async performBasicOCR(imageFile: File): Promise<OCRResult> {
    try {
      const worker = await this.getTesseractWorker();
      
      // Configuration optimisée pour cartes de visite
      await worker.setParameters({
        tessedit_pageseg_mode: '6',  // Assume uniform block of text (optimal pour cartes)
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸàâäçéèêëîïôöùûüÿ0123456789@.-+() /',
        preserve_interword_spaces: '1',
        tessedit_ocr_engine_mode: '1',  // LSTM only (meilleur pour texte moderne)
      });
      
      // Reconnaissance avec worker pré-initialisé (plus rapide)
      const { data } = await worker.recognize(imageFile);

      return {
        text: data.text,
        confidence: data.confidence / 100, // Convertir en 0-1
        language: this.detectLanguage(data.text),
      };
    } catch (error) {
      // Reset worker en cas d'erreur
      this.tesseractWorker = null;
      throw new Error('Impossible de lire le texte de l\'image');
    }
  }

  /**
   * Précharge le worker Tesseract en arrière-plan (appeler au démarrage de l'app)
   */
  static async preloadTesseractWorker(): Promise<void> {
    if (!this.GOOGLE_VISION_API_KEY) {
      // Précharger seulement si on n'a pas Google Vision
      await this.getTesseractWorker();
    }
  }

  /**
   * Parse le texte avec GPT-4 Vision (ou fallback regex si pas de clé OpenAI)
   */
  private static async parseWithGPT4Vision(imageFile: File, ocrResult: OCRResult): Promise<AIParsingResult> {
    // Vérification stricte : clé existe ET commence par "sk-"
    const hasValidOpenAIKey = this.OPENAI_API_KEY && this.OPENAI_API_KEY.startsWith('sk-');
    
    if (!hasValidOpenAIKey) {
      console.warn('⚠️ OpenAI API key non trouvée ou invalide, utilisation du parsing regex');
      // Fallback: parsing basique avec regex
      return this.parseWithRegex(ocrResult.text);
    }
    
    // Rate limiting : vérifier délai minimum (Tier 0 = 3 RPM = 20s entre appels)
    const now = Date.now();
    const timeSinceLastCall = now - this.lastOpenAICall;
    
    if (timeSinceLastCall < this.MIN_DELAY_OPENAI) {
      const remainingDelay = Math.ceil((this.MIN_DELAY_OPENAI - timeSinceLastCall) / 1000);
      console.warn(`⚠️ Rate limit OpenAI : attendre ${remainingDelay}s avant prochain appel`);
      console.log('🔄 Utilisation du parsing regex (éviter 429 Too Many Requests)');
      // Utiliser regex pour éviter erreur 429
      return this.parseWithRegex(ocrResult.text);
    }
    
    // Enregistrer timestamp de l'appel
    this.lastOpenAICall = now;

    console.log('🤖 Démarrage parsing GPT-4o-mini...');
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      // Créer une promesse de timeout (15s pour OpenAI car plus lent)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout (15s)')), 15000);
      });
      
      const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',  // Optimisé: 80% moins cher que gpt-4-vision
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Tu es un système d'extraction professionnelle de données issues de cartes de visite.

Tu combines de manière experte :
• le contenu visuel de l'image,
• les textes OCR bruts,
• la disposition graphique,
• la logique métier,
• les heuristiques linguistiques,
• la correction automatique d'erreurs OCR.

Ton objectif : produire les informations les plus fiables possibles, sous forme de JSON structuré, sans halluciner et sans inventer.

🔥 SECTION 1 — Analyse visuelle obligatoire

Analyse l'image avant le texte OCR.
Donne la priorité à ce que tu vois réellement sur la carte.

Règles :
• L'image a toujours priorité sur l'OCR brut lorsqu'il y a contradiction.
• Le texte dans un logo décoratif ne doit jamais être considéré comme une donnée.
• Identifie les zones de texte : Nom, Poste, Entreprise, Contact, Réseaux sociaux, Adresse
• Détecte la hiérarchie visuelle :
  - Le nom de la personne est généralement le plus gros texte.
  - Le poste est juste en dessous ou proche du nom.
  - L'entreprise apparaît en haut ou en bas, en plus petit ou en logo.
  - Les coordonnées sont regroupées ensemble (bloc contact).

🔍 SECTION 2 — Correction intelligente des erreurs OCR

Corrige systématiquement les erreurs suivantes :
• 0 → o dans les emails / sites
• 0 → 0 si position numérique
• 1 ↔︎ l / I selon contexte
• rn → m
• cl → d
• vv → w
• S en début de numéro → + (erreur fréquente)
• Doubles symboles comme ".." → "."

Si un email ou un numéro semble erroné, reconstruis-le selon la logique métier.

🧠 SECTION 3 — Heuristiques linguistiques & internationales

Noms / prénoms :
• Respecte les capitalisations : "Jean Dupont", pas "JEAN DUPONT".
• Si la carte semble asiatique (JP, CN, KR), autorise nom → prénom inversé.
• Pas de chiffres dans les noms.

Téléphones :
• Normalise vers format international : +XX X XX XX XX
• Accepte uniquement chiffres, espaces, +, -, parenthèses.
• Si plusieurs numéros sont présents, sépare en phone et phoneAlt.

Emails :
• Un email doit respecter username@domaine.ext.
• Corrige automatiquement les erreurs OCR.
• Si plusieurs emails : le premier devient email, le second devient emailAlt

Sites & URL :
• Si un domaine apparaît sans "https://", ajoute-le.
• Corrige les extensions (.com, .fr, .net, .io).

Adresses :
• Reconnais formats : EU (rue + code postal + ville + pays), US (number + street + state + ZIP)

Réseaux sociaux :
• Détecte : LinkedIn, X/Twitter, Facebook, Instagram, TikTok, YouTube, GitHub
• Un seul champ par plateforme (linkedin, github, etc.)

🛡️ SECTION 4 — Gestion multi-valeurs

Téléphones : 1er → phone, 2e → phoneAlt
Emails : 1er → email, 2e → emailAlt
Règle : N'affiche pas de tableau. Toujours une seule valeur par champ.
Si plus de 2 numéros/emails existent → garde les 2 plus plausibles.

📈 SECTION 5 — Système de confiance

Pour chaque champ :
• Si confiance ≥ 80% → renvoie la donnée.
• Si confiance entre 50–79% → renvoie la donnée corrigée.
• Si confiance < 50% → n'inclus pas ce champ.

Ne renvoie jamais d'information spéculative.

⚙️ SECTION 6 — Nettoyage & Normalisation

Avant de renvoyer, effectue :
• trimming des espaces
• suppression des caractères parasites
• normalisation ponctuation
• correction des doublons
• uniformisation capitale/minuscule

📦 SECTION 7 — Format de sortie obligatoire (strict JSON)

Renvoie uniquement le JSON suivant :

{
  "fullName": "",
  "firstName": "",
  "lastName": "",
  "jobTitle": "",
  "company": "",
  "email": "",
  "emailAlt": "",
  "phone": "",
  "phoneAlt": "",
  "website": "",
  "address": "",
  "city": "",
  "postalCode": "",
  "country": "",
  "linkedin": "",
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "tiktok": "",
  "youtube": "",
  "github": "",
  "confidence": 0.95,
  "suggestions": []
}

IMPORTANT :
• Ne renvoie aucun champ vide.
• Supprime complètement les champs non remplis.
• JSON strict, aucun texte avant/après.

🧩 SECTION 8 — Règles finales impératives

• Ne jamais inventer.
• Priorité à l'image → ensuite OCR → ensuite logique métier.
• Ne jamais utiliser le texte issu d'un logo décoratif.
• Corriger les erreurs OCR systématiquement.
• Préserver la casse pour emails et URLs.
• Renvoi final = JSON propre et valide uniquement.

---

Texte OCR détecté (utilise-le comme référence, mais priorité à ce que tu VOIS dans l'image) :
"${ocrResult.text}"`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Image,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });
      
      // Race entre fetch et timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('✅ GPT-4o-mini réponse reçue');

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Aucune réponse de l\'IA');
      }

      // Extraire le JSON de la réponse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format de réponse invalide');
      }

      const rawResult = JSON.parse(jsonMatch[0]);
      
      // Mapper les nouveaux champs du prompt vers l'interface existante
      const result = {
        name: rawResult.fullName || rawResult.name,
        firstName: rawResult.firstName,
        lastName: rawResult.lastName,
        title: rawResult.jobTitle || rawResult.title,
        company: rawResult.company,
        email: rawResult.email,
        emailAlt: rawResult.emailAlt,  // Nouveau champ
        phone: rawResult.phone,
        phoneAlt: rawResult.phoneAlt,  // Nouveau champ
        website: rawResult.website,
        address: rawResult.address ? {
          full: rawResult.address,
          city: rawResult.city,
          postalCode: rawResult.postalCode,
          country: rawResult.country,
        } : undefined,
        socialMedia: {
          linkedin: rawResult.linkedin,
          twitter: rawResult.twitter,
          facebook: rawResult.facebook,
          instagram: rawResult.instagram,
          youtube: rawResult.youtube,
          tiktok: rawResult.tiktok,
          github: rawResult.github,
        },
        confidence: rawResult.confidence || 0.8,
        suggestions: Array.isArray(rawResult.suggestions) ? rawResult.suggestions : [],
      };
      
      // Nettoyer le téléphone principal
      if (result.phone) {
        result.phone = this.cleanPhoneNumber(result.phone);
      }
      
      // Nettoyer le téléphone alternatif
      if (result.phoneAlt) {
        result.phoneAlt = this.cleanPhoneNumber(result.phoneAlt);
      }
      
      // Nettoyer le site web
      if (result.website) {
        result.website = this.cleanWebsite(result.website);
      }
      
      // Nettoyer les réseaux sociaux (supprimer les valeurs vides)
      if (result.socialMedia) {
        Object.keys(result.socialMedia).forEach(key => {
          if (!result.socialMedia![key as keyof typeof result.socialMedia]) {
            delete result.socialMedia![key as keyof typeof result.socialMedia];
          }
        });
      }
      
      console.log('✅ Parsing GPT-4o-mini terminé avec succès');
      
      return {
        ...result,
        rawData: {
          rawText: ocrResult.text,
          detectedLanguage: ocrResult.language,
        },
      };
    } catch (error) {
      console.warn('⚠️ OpenAI API échec:', error);
      console.log('🔄 Fallback vers parsing regex avancé...');
      return this.parseWithRegex(ocrResult.text);
    }
  }

  /**
   * Parsing basique avec regex (fallback) - Version améliorée
   */
  private static parseWithRegex(text: string): AIParsingResult {
    console.log('🔧 Utilisation du parsing regex avancé (fallback)');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 1. DÉTECTION EMAIL (ultra-améliorée)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = text.match(emailRegex) || [];
    const email = this.selectBestEmail(emailMatches);
    
    // 2. DÉTECTION TÉLÉPHONE (ultra-améliorée - formats internationaux)
    const phoneRegex = /(\+?[0-9\s\-\.\(\)]{8,})/g;
    const phoneMatches = text.match(phoneRegex) || [];
    const phone = this.selectBestPhone(phoneMatches);
    
    // 3. DÉTECTION SITE WEB (ultra-améliorée)
    const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const websiteMatches = text.match(websiteRegex) || [];
    const website = this.selectBestWebsite(websiteMatches);
    
    // 4. DÉTECTION ENTREPRISE (astuce : mot avant .com)
    let company = '';
    if (website) {
      // Extraire le nom de domaine principal
      const domainMatch = website.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\./);
      if (domainMatch) {
        const domainName = domainMatch[1];
        
        // Chercher ce nom dans les lignes du texte
        const foundLine = lines.find(line => 
          line.toLowerCase().includes(domainName.toLowerCase()) &&
          !line.includes('@') &&
          !line.includes('http') &&
          !line.includes('www')
        );
        
        if (foundLine) {
          // Si on trouve une ligne contenant le nom de domaine, l'utiliser
          company = foundLine;
        } else {
          // Sinon, utiliser directement le nom de domaine (sans www, .com, etc.)
          company = domainName;
        }
      }
    }
    
    // Si pas trouvé via le site web, chercher avec les mots-clés d'entreprise
    if (!company) {
      const companyKeywords = ['ltd', 'inc', 'corp', 'sarl', 'sa', 'sas', 'entreprise', 'company', 'société', 'groupe', 'group'];
      company = lines.find(line => 
        companyKeywords.some(keyword => line.toLowerCase().includes(keyword)) &&
        line.length > 3 && line.length < 50
      ) || '';
    }
    
    // 5. DÉTECTION NOM (améliorée)
    const name = this.detectName(lines, email, phone, website, company);
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // 6. DÉTECTION TITRE (améliorée)
    const title = this.detectTitle(lines, name, company, email, phone, website);
    
    // 7. DÉTECTION ADRESSE (ultra-améliorée)
    const address = this.detectAdvancedAddress(lines);
    
    // 8. DÉTECTION RÉSEAUX SOCIAUX (ultra-améliorée)
    const socialMedia = this.detectAdvancedSocialMedia(text);
    
    // 9. CALCUL DE CONFIANCE (amélioré)
    const confidence = this.calculateConfidence(email, phone, website, company, name);
    
    // 10. CORRECTION ORTHOGRAPHIQUE
    const correctedText = this.correctSpelling(text);
    const correctedName = this.correctSpelling(name);
    const correctedCompany = this.correctSpelling(company);
    const correctedTitle = this.correctSpelling(title);
    
    // 11. DÉTECTION DE MARQUES
    const detectedBrands = this.detectBrands(text);
    
    // 12. VALIDATION AVANCÉE
    const validation = this.validateAdvancedData({
      email, phone, website, company: correctedCompany, name: correctedName
    });
    
    // 13. SUGGESTIONS (améliorées)
    const suggestions = this.generateSuggestions(email, phone, website, correctedCompany, correctedName, correctedText);
    
    // Ajouter les suggestions de validation
    if (!validation.isValid) {
      suggestions.push(...validation.errors.map(error => `⚠️ ${error}`));
    }
    
    // Ajouter les marques détectées
    if (detectedBrands.length > 0) {
      suggestions.push(`🏢 Marques détectées: ${detectedBrands.join(', ')}`);
    }

    return {
      name: correctedName,
      firstName: correctedName.split(' ')[0] || '',
      lastName: correctedName.split(' ').slice(1).join(' ') || '',
      title: correctedTitle,
      company: correctedCompany,
      email,
      phone,
      website,
      address: {
        full: address,
      },
      socialMedia,
      confidence: validation.isValid ? confidence : Math.max(0.1, confidence - 0.2),
      rawData: {
        rawText: correctedText,
        detectedLanguage: this.detectLanguage(correctedText),
      },
      suggestions,
    };
  }

  /**
   * Sélectionne le meilleur email parmi plusieurs candidats
   */
  private static selectBestEmail(emails: string[]): string {
    if (emails.length === 0) return '';
    if (emails.length === 1) return emails[0];
    
    // Prioriser les emails professionnels
    const professionalDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
    const professionalEmails = emails.filter(email => 
      !professionalDomains.some(domain => email.toLowerCase().includes(domain))
    );
    
    if (professionalEmails.length > 0) {
      return professionalEmails[0];
    }
    
    // Sinon, prendre le premier
    return emails[0];
  }

  /**
   * Sélectionne le meilleur téléphone parmi plusieurs candidats
   */
  private static selectBestPhone(phones: string[]): string {
    if (phones.length === 0) return '';
    if (phones.length === 1) return this.cleanPhoneNumber(phones[0]);
    
    // Prioriser les téléphones avec indicatif international
    const internationalPhones = phones.filter(phone => 
      phone.startsWith('+') || phone.startsWith('00')
    );
    
    if (internationalPhones.length > 0) {
      return this.cleanPhoneNumber(internationalPhones[0]);
    }
    
    // Prioriser les téléphones plus longs (plus complets)
    const sortedPhones = phones.sort((a, b) => b.length - a.length);
    return this.cleanPhoneNumber(sortedPhones[0]);
  }

  /**
   * Sélectionne le meilleur site web parmi plusieurs candidats
   */
  private static selectBestWebsite(websites: string[]): string {
    if (websites.length === 0) return '';
    if (websites.length === 1) return this.cleanWebsite(websites[0]);
    
    // Prioriser les sites avec https
    const httpsSites = websites.filter(site => site.startsWith('https://'));
    if (httpsSites.length > 0) {
      return this.cleanWebsite(httpsSites[0]);
    }
    
    // Prioriser les sites avec www
    const wwwSites = websites.filter(site => site.includes('www.'));
    if (wwwSites.length > 0) {
      return this.cleanWebsite(wwwSites[0]);
    }
    
    // Sinon, prendre le premier
    return this.cleanWebsite(websites[0]);
  }

  /**
   * Nettoie une URL de site web
   */
  private static cleanWebsite(website: string): string {
    if (!website) return '';
    
    // Supprimer les caractères parasites (€, etc.)
    let cleaned = website.replace(/[€$£¥₹]/g, '').trim();
    
    // Ajouter https:// si manquant
    if (!cleaned.startsWith('http')) {
      cleaned = `https://${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Nettoie le numéro de téléphone (supprime parenthèses, espaces, garde chiffres et +)
   */
  private static cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Supprimer tout sauf chiffres et +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }
    
    return cleaned;
  }

  /**
   * Détecte le nom (amélioré)
   */
  private static detectName(lines: string[], email: string, phone: string, website: string, company: string): string {
    // Exclure les lignes qui contiennent des informations techniques
    const excludePatterns = [
      /@/, // email
      /\+?[0-9\s\-\.]{8,}/, // téléphone
      /https?:\/\//, // site web
      /www\./, // www
      /\.(com|fr|org|net|co)/, // domaines
      /ltd|inc|corp|sarl|sa|sas/i, // mots d'entreprise
      /directeur|manager|ceo|cto|founder/i, // titres
    ];
    
    // Chercher la première ligne qui ne contient pas ces patterns
    for (const line of lines) {
      if (line.length > 2 && line.length < 50) {
        const isExcluded = excludePatterns.some(pattern => pattern.test(line));
        if (!isExcluded && line !== company) {
          return line;
        }
      }
    }
    
    return lines[0] || '';
  }

  /**
   * Détecte le titre (amélioré avec position relative au nom)
   */
  private static detectTitle(lines: string[], name: string, company: string, email: string, phone: string, website: string): string {
    const titleKeywords = [
      'directeur', 'directrice', 'manager', 'ceo', 'cto', 'cfo', 'founder', 'fondateur',
      'président', 'présidente', 'pdg', 'dg', 'responsable', 'chef', 'lead',
      'consultant', 'consultante', 'expert', 'spécialiste', 'analyste',
      'développeur', 'développeuse', 'ingénieur', 'ingénieure', 'architecte',
      'designer', 'marketing', 'commercial', 'commerciale', 'vendeur', 'vendeuse',
      'associé', 'associée', 'partner', 'gérant', 'gérante', 'adjoint', 'adjointe',
      'assistant', 'assistante', 'coordinateur', 'coordinatrice', 'superviseur',
      'avocat', 'avocate', 'notaire', 'comptable', 'juriste'
    ];
    
    // PRIORITÉ 1 : Ligne juste APRÈS le nom (position la plus courante)
    const nameIndex = lines.findIndex(line => line.includes(name) || name.includes(line));
    if (nameIndex >= 0 && nameIndex + 1 < lines.length) {
      const nextLine = lines[nameIndex + 1];
      // Vérifier que ce n'est pas une information de contact
      if (nextLine.length > 3 && nextLine.length < 60 && 
          !nextLine.includes('@') && 
          !nextLine.includes('http') && 
          !nextLine.includes('www') &&
          !/\+?[0-9\s\-\.]{8,}/.test(nextLine) &&
          nextLine !== company) {
        // Nettoyer les icônes mal reconnues (caractères unicodes bizarres)
        const cleaned = nextLine.replace(/[^\w\sàâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ\/\-]/g, '').trim();
        if (cleaned.length > 3) {
          return cleaned;
        }
      }
    }
    
    // PRIORITÉ 2 : Chercher une ligne contenant des mots-clés de titre
    for (const line of lines) {
      if (line.length > 3 && line.length < 60) {
        const hasTitleKeyword = titleKeywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasTitleKeyword && line !== name && line !== company) {
          // Nettoyer les icônes
          const cleaned = line.replace(/[^\w\sàâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ\/\-]/g, '').trim();
          return cleaned || line;
        }
      }
    }
    
    // PRIORITÉ 3 : Ligne courte entre le nom et l'entreprise
    const companyIndex = lines.findIndex(line => line === company);
    if (nameIndex >= 0 && companyIndex > nameIndex) {
      for (let i = nameIndex + 1; i < companyIndex; i++) {
        const line = lines[i];
        if (line.length > 3 && line.length < 60 && 
            !line.includes('@') && !line.includes('http') && 
            !/\+?[0-9\s\-\.]{8,}/.test(line)) {
          const cleaned = line.replace(/[^\w\sàâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ\/\-]/g, '').trim();
          if (cleaned.length > 3) {
            return cleaned;
          }
        }
      }
    }
    
    return '';
  }

  /**
   * Détecte l'adresse (ultra-améliorée avec détection icône pin)
   */
  private static detectAdvancedAddress(lines: string[]): string {
    const addressKeywords = [
      'rue', 'avenue', 'boulevard', 'place', 'allée', 'chemin', 'route', 'impasse',
      'street', 'avenue', 'road', 'lane', 'drive', 'court', 'circle', 'way',
      'straße', 'platz', 'allee', 'weg', 'gasse', 'via', 'corso', 'piazza',
      'immeuble', 'bâtiment', 'résidence', 'étage', 'floor', 'building', 'suite'
    ];
    
    // Codes postaux internationaux
    const postalCodeRegexes = [
      /\b\d{5}\b/, // France
      /\b\d{4}\b/, // Belgique, Suisse
      /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/, // Canada
      /\b\d{5}-\d{4}\b/, // USA
      /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/, // UK
      /\b\d{4}\s?[A-Z]{2}\b/, // Pays-Bas
    ];
    
    const cityRegex = /\b[A-Z][a-z]+(?:-[A-Z][a-z]+)*\b/;
    
    // Nettoyer les lignes des icônes (pin, téléphone, email mal reconnus par OCR)
    const cleanedLines = lines.map(line => ({
      original: line,
      // Garder lettres, chiffres, espaces, ponctuation basique, accents
      cleaned: line.replace(/[^\w\sàâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ0-9,\.\/\-\(\)]/g, ' ').trim()
    }));
    
    // PRIORITÉ 1 : Ligne avec icône pin (caractères bizarres) suivie d'une adresse
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      
      // Détecter icône pin : ligne très courte (<5 chars) avec caractères non-alphabétiques
      const isPinIcon = line.length < 5 && /[^\w\s]/.test(line);
      
      if (isPinIcon && nextLine.length > 10) {
        // La ligne suivante est probablement l'adresse
        const cleaned = cleanedLines[i + 1].cleaned;
        // IMPORTANT : Vérifier que ce n'est PAS un numéro de téléphone
        const isPhoneNumber = /^[\+]?[0-9\s\-\.]{10,}$/.test(cleaned);
        if (cleaned.length > 10 && !isPhoneNumber) {
          return cleaned;
        }
      }
    }
    
    // PRIORITÉ 2 : Chercher une ligne contenant des éléments d'adresse
    for (const lineObj of cleanedLines) {
      const { original, cleaned } = lineObj;
      
      if (cleaned.length > 10) {
        // IMPORTANT : Exclure les numéros de téléphone (que des chiffres/espaces/+/-)
        const isPhoneNumber = /^[\+]?[0-9\s\-\.]{10,}$/.test(cleaned);
        
        if (isPhoneNumber) {
          continue; // Ignorer cette ligne, c'est un téléphone
        }
        
        const hasAddressKeyword = addressKeywords.some(keyword => 
          cleaned.toLowerCase().includes(keyword)
        );
        const hasPostalCode = postalCodeRegexes.some(regex => regex.test(cleaned));
        const hasCity = cityRegex.test(cleaned);
        
        // Ligne commence par un numéro (ex: "5ème étage", "123 rue...")
        const startsWithNumber = /^\d/.test(cleaned);
        
        if (hasAddressKeyword || (hasPostalCode && hasCity) || (startsWithNumber && cleaned.length > 15)) {
          return cleaned;
        }
      }
    }
    
    // Si pas trouvé, chercher une ligne avec code postal + ville
    for (const line of lines) {
      if (line.length > 8) {
        const hasPostalCode = postalCodeRegexes.some(regex => regex.test(line));
        const hasCity = cityRegex.test(line);
        
        if (hasPostalCode && hasCity) {
          return line;
        }
      }
    }
    
    return '';
  }

  /**
   * Détecte les réseaux sociaux (ultra-améliorée)
   */
  private static detectAdvancedSocialMedia(text: string): any {
    const socialMedia: any = {};
    
    // LinkedIn (amélioré)
    const linkedinRegexes = [
      /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
      /linkedin\.com\/company\/([a-zA-Z0-9-]+)/i,
      /@([a-zA-Z0-9-]+).*linkedin/i,
      /linkedin.*@([a-zA-Z0-9-]+)/i
    ];
    
    for (const regex of linkedinRegexes) {
      const match = text.match(regex);
      if (match) {
        const username = match[1];
        if (text.toLowerCase().includes('company')) {
          socialMedia.linkedin = `https://linkedin.com/company/${username}`;
        } else {
          socialMedia.linkedin = `https://linkedin.com/in/${username}`;
        }
        break;
      }
    }
    
    // Twitter/X (amélioré)
    const twitterRegexes = [
      /(?:twitter\.com\/|x\.com\/)([a-zA-Z0-9_]+)/i,
      /@([a-zA-Z0-9_]+).*twitter/i,
      /twitter.*@([a-zA-Z0-9_]+)/i
    ];
    
    for (const regex of twitterRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.twitter = `https://twitter.com/${match[1]}`;
        break;
      }
    }
    
    // Instagram (amélioré)
    const instagramRegexes = [
      /instagram\.com\/([a-zA-Z0-9_.]+)/i,
      /@([a-zA-Z0-9_.]+).*instagram/i,
      /instagram.*@([a-zA-Z0-9_.]+)/i
    ];
    
    for (const regex of instagramRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.instagram = `https://instagram.com/${match[1]}`;
        break;
      }
    }
    
    // Facebook (amélioré)
    const facebookRegexes = [
      /facebook\.com\/([a-zA-Z0-9.]+)/i,
      /fb\.com\/([a-zA-Z0-9.]+)/i,
      /@([a-zA-Z0-9.]+).*facebook/i,
      /facebook.*@([a-zA-Z0-9.]+)/i
    ];
    
    for (const regex of facebookRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.facebook = `https://facebook.com/${match[1]}`;
        break;
      }
    }
    
    // YouTube (nouveau)
    const youtubeRegexes = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/i,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/i,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/i,
      /@([a-zA-Z0-9_-]+).*youtube/i,
      /youtube.*@([a-zA-Z0-9_-]+)/i
    ];
    
    for (const regex of youtubeRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.youtube = `https://youtube.com/c/${match[1]}`;
        break;
      }
    }
    
    // TikTok (nouveau)
    const tiktokRegexes = [
      /tiktok\.com\/@([a-zA-Z0-9_.]+)/i,
      /@([a-zA-Z0-9_.]+).*tiktok/i,
      /tiktok.*@([a-zA-Z0-9_.]+)/i
    ];
    
    for (const regex of tiktokRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.tiktok = `https://tiktok.com/@${match[1]}`;
        break;
      }
    }
    
    // GitHub (nouveau)
    const githubRegexes = [
      /github\.com\/([a-zA-Z0-9_-]+)/i,
      /@([a-zA-Z0-9_-]+).*github/i,
      /github.*@([a-zA-Z0-9_-]+)/i
    ];
    
    for (const regex of githubRegexes) {
      const match = text.match(regex);
      if (match) {
        socialMedia.github = `https://github.com/${match[1]}`;
        break;
      }
    }
    
    return socialMedia;
  }

  /**
   * Calcule la confiance (amélioré)
   */
  private static calculateConfidence(email: string, phone: string, website: string, company: string, name: string): number {
    let confidence = 0;
    
    // Email valide = +0.3
    if (email && email.includes('@') && email.includes('.')) {
      confidence += 0.3;
    }
    
    // Téléphone valide = +0.25
    if (phone && phone.length >= 8) {
      confidence += 0.25;
    }
    
    // Site web valide = +0.2
    if (website && website.includes('.')) {
      confidence += 0.2;
    }
    
    // Entreprise détectée = +0.15
    if (company && company.length > 2) {
      confidence += 0.15;
    }
    
    // Nom détecté = +0.1
    if (name && name.length > 2) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Génère des suggestions (amélioré)
   */
  private static generateSuggestions(email: string, phone: string, website: string, company: string, name: string, text: string): string[] {
    const suggestions: string[] = [];
    
    if (!email) {
      suggestions.push('Email non détecté - vérifiez manuellement');
    }
    
    if (!phone) {
      suggestions.push('Téléphone non détecté - vérifiez manuellement');
    }
    
    if (!website) {
      suggestions.push('Site web non détecté - vérifiez manuellement');
    }
    
    if (!company) {
      suggestions.push('Entreprise non détectée - vérifiez manuellement');
    }
    
    if (!name) {
      suggestions.push('Nom non détecté - vérifiez manuellement');
    }
    
    // Suggestion basée sur la qualité du texte
    if (text.length < 50) {
      suggestions.push('Texte très court - qualité d\'image à vérifier');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Toutes les informations principales ont été détectées');
    }
    
    return suggestions;
  }

  /**
   * Correction orthographique intelligente avec contexte
   */
  private static correctSpelling(text: string): string {
    // Supprimer les caractères parasites d'abord
    let corrected = text.replace(/[€$£¥₹]/g, '').trim();
    
    // Corrections contextuelles d'OCR (ordre important)
    const contextualCorrections = [
      // Emails (avant corrections générales)
      { pattern: /grnail\.com/gi, replacement: 'gmail.com' },
      { pattern: /gmaii\.com/gi, replacement: 'gmail.com' },
      { pattern: /ernail/gi, replacement: 'email' },
      { pattern: /e-rnail/gi, replacement: 'e-mail' },
      
      // URLs
      { pattern: /vvvvw\./gi, replacement: 'www.' },
      { pattern: /wvvw\./gi, replacement: 'www.' },
      { pattern: /\.c0m\b/gi, replacement: '.com' },
      { pattern: /\.fr0m\b/gi, replacement: '.from' },
      
      // Téléphones
      { pattern: /phane/gi, replacement: 'phone' },
      { pattern: /te1/gi, replacement: 'tel' },
      { pattern: /tei/gi, replacement: 'tel' },
      
      // Titres professionnels
      { pattern: /directeur/gi, replacement: 'directeur' },
      { pattern: /rnanager/gi, replacement: 'manager' },
      { pattern: /rnanger/gi, replacement: 'manager' },
      { pattern: /cornmercial/gi, replacement: 'commercial' },
      
      // Mots communs
      { pattern: /\bcornpany\b/gi, replacement: 'company' },
      { pattern: /\bcornpagnie\b/gi, replacement: 'compagnie' },
      { pattern: /\bsociete\b/gi, replacement: 'société' },
      
      // Caractères isolés mal reconnus (contexte numérique)
      { pattern: /\bO(\d)/g, replacement: '0$1' },  // O suivi de chiffre = 0
      { pattern: /(\d)O\b/g, replacement: '$10' },  // O précédé de chiffre = 0
      { pattern: /\bl(\d)/g, replacement: '1$1' },  // l suivi de chiffre = 1
      { pattern: /(\d)l\b/g, replacement: '$11' },  // l précédé de chiffre = 1
    ];
    
    // Appliquer les corrections contextuelles
    for (const { pattern, replacement } of contextualCorrections) {
      corrected = corrected.replace(pattern, replacement);
    }
    
    return corrected;
  }

  /**
   * Détecte et extrait les logos/marques
   */
  private static detectBrands(text: string): string[] {
    const brands = [
      'Microsoft', 'Google', 'Apple', 'Amazon', 'Facebook', 'Meta',
      'Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'TikTok',
      'Netflix', 'Spotify', 'Adobe', 'Salesforce', 'HubSpot',
      'Slack', 'Zoom', 'Teams', 'WhatsApp', 'Telegram',
      'GitHub', 'GitLab', 'Bitbucket', 'Docker', 'Kubernetes',
      'AWS', 'Azure', 'GCP', 'IBM', 'Oracle', 'SAP'
    ];
    
    const detectedBrands: string[] = [];
    
    for (const brand of brands) {
      if (text.toLowerCase().includes(brand.toLowerCase())) {
        detectedBrands.push(brand);
      }
    }
    
    return detectedBrands;
  }

  /**
   * Validation avancée des données
   */
  private static validateAdvancedData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validation email avancée
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Format email invalide');
      }
      
      // Vérifier les domaines suspects
      const suspiciousDomains = ['example.com', 'test.com', 'localhost'];
      if (suspiciousDomains.some(domain => data.email.includes(domain))) {
        errors.push('Email de test détecté');
      }
    }
    
    // Validation téléphone avancée
    if (data.phone) {
      const phoneRegex = /^[\+]?[0-9\s\-]{8,}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Format téléphone invalide');
      }
      
      // Vérifier les numéros suspects
      const suspiciousPhones = ['0000000000', '1234567890', '0123456789'];
      if (suspiciousPhones.includes(data.phone.replace(/[\s\-]/g, ''))) {
        errors.push('Numéro de téléphone de test détecté');
      }
    }
    
    // Validation site web avancée
    if (data.website) {
      try {
        new URL(data.website.startsWith('http') ? data.website : `https://${data.website}`);
      } catch {
        errors.push('URL invalide');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide et corrige les résultats
   */
  private static validateAndCorrect(aiResult: AIParsingResult, ocrResult: OCRResult): AIParsingResult {
    const corrected = { ...aiResult };
    
    // Validation de l'email
    if (corrected.email && !this.isValidEmail(corrected.email)) {
      corrected.email = '';
    }
    
    // Nettoyage et validation du téléphone
    if (corrected.phone) {
      corrected.phone = this.cleanPhoneNumber(corrected.phone);
      if (!this.isValidPhone(corrected.phone)) {
        corrected.phone = '';
      }
    }
    
    // Validation du site web
    if (corrected.website && !this.isValidWebsite(corrected.website)) {
      corrected.website = '';
    }
    
    // Correction de la confiance basée sur la qualité OCR
    corrected.confidence = Math.min(corrected.confidence, ocrResult.confidence);
    
    // Ajout de suggestions basées sur les validations
    const suggestions = [...corrected.suggestions];
    if (!corrected.email) suggestions.push('Email non détecté ou invalide');
    if (!corrected.phone) suggestions.push('Téléphone non détecté ou invalide');
    if (!corrected.company) suggestions.push('Entreprise non détectée');
    
    corrected.suggestions = suggestions;
    
    return corrected;
  }

  /**
   * Utilitaires de validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static isValidWebsite(website: string): boolean {
    try {
      new URL(website.startsWith('http') ? website : `https://${website}`);
      return true;
    } catch {
      return false;
    }
  }

  private static calculateConfidenceFromAnnotations(annotations: any[]): number {
    if (annotations.length === 0) return 0;
    
    // Google Vision ne fournit pas de confidence, on estime basé sur la longueur du texte
    const textLength = annotations[0]?.description?.length || 0;
    return Math.min(0.9, Math.max(0.3, textLength / 100));
  }

  private static detectLanguage(text: string): string {
    // Détection basique de la langue
    const frenchWords = ['de', 'la', 'le', 'et', 'à', 'un', 'une', 'des', 'du', 'dans'];
    const englishWords = ['the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'with'];
    
    const words = text.toLowerCase().split(/\s+/);
    const frenchCount = words.filter(word => frenchWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    if (frenchCount > englishCount) return 'fr';
    if (englishCount > frenchCount) return 'en';
    return 'unknown';
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
