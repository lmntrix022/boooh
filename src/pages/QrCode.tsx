import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, ArrowLeft, Loader2, Share2, QrCode as QrCodeIcon, Check, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { generateCardUrl } from "@/utils/cardUrlUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import QRCode from "qrcode";

// QR_CODE_SIZES and QR_CODE_COLORS will be defined dynamically with translations

const AnimatedOrbs = () => null;

// Helper function to draw rounded rectangles (for browsers that don't support roundRect)
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const QrCode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [size, setSize] = useState("medium");
  const [color, setColor] = useState("#000000");
  const [customName, setCustomName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // Helper functions for color conversion
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };
  
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  
  // Update HSL when color changes
  useEffect(() => {
    const [h, s, l] = hexToHsl(color);
    setHue(h);
    setSaturation(s);
    setLightness(l);
  }, [color]);
  
  // Update color when HSL changes
  const updateColorFromHsl = (h: number, s: number, l: number) => {
    const newColor = hslToHex(h, s, l);
    setColor(newColor);
  };

  // Define QR_CODE_SIZES and QR_CODE_COLORS dynamically with translations
  const QR_CODE_SIZES = [
    { value: "small", label: t('qrCode.sizes.small') },
    { value: "medium", label: t('qrCode.sizes.medium') },
    { value: "large", label: t('qrCode.sizes.large') },
  ];

  const QR_CODE_COLORS = [
    { value: "#000000", label: t('qrCode.colors.black') },
    { value: "#1F2937", label: t('qrCode.colors.darkGray') },
    { value: "#374151", label: t('qrCode.colors.gray') },
    { value: "#6B7280", label: t('qrCode.colors.lightGray') },
    { value: "#D1D5DB", label: t('qrCode.colors.veryLightGray') },
  ];

  useEffect(() => {
    if (!id || !user) return;

    const fetchCard = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("business_cards")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: t('qrCode.errors.cardNotFound'),
            description: t('qrCode.errors.cardNotFoundDescription'),
            variant: "destructive",
          });
          return;
        }

        setCardData(data);
        if (data.qr_code_url) {
          setQrCodeUrl(data.qr_code_url);
        }
        
        // Set custom name from card name
        setCustomName(data.name || "");
      } catch (error: any) {
        // Error log removed
        toast({
          title: t('qrCode.errors.error'),
          description: t('qrCode.errors.loadError'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id, user, toast]);

  const generateQrCode = async () => {
    if (!id || !cardData) return;

    try {
      setGenerating(true);
      
      // In a real app, you would call an API to generate the QR code
      // Here we'll just simulate it with a timeout
      
      // Generate shareable URL
      let cardUrl = generateCardUrl(id, cardData?.slug);
      if (customName) {
        cardUrl += `?name=${encodeURIComponent(customName)}`;
      }
      
      // Normally you would call your backend function here
      // const { data, error } = await supabase.functions.invoke('generate-qr', { 
      //   body: { url: cardUrl, size, color } 
      // });
      
      // For now, we'll use a placeholder URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(cardUrl)}&size=${size === 'small' ? '200x200' : size === 'medium' ? '300x300' : '400x400'}&color=${color.substring(1)}`;
      
      // Update the card with the QR code URL
      const { error: updateError } = await supabase
        .from("business_cards")
        .update({ qr_code_url: qrUrl })
        .eq("id", id);

      if (updateError) throw updateError;
      
      setQrCodeUrl(qrUrl);
      
      toast({
        title: t('qrCode.toasts.generated'),
        description: t('qrCode.toasts.generatedDescription'),
      });
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('qrCode.errors.error'),
        description: t('qrCode.errors.generateError'),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQrCode = async () => {
    if (!qrCodeUrl || !id || !cardData) return;
    
    try {
      // Generate card URL
      let cardUrl = generateCardUrl(id, cardData?.slug);
      if (customName) {
        cardUrl += `?name=${encodeURIComponent(customName)}`;
      }

      // Create ultra-premium canvas design
      const canvasSize = size === 'small' ? 1200 : size === 'medium' ? 1600 : 2000; // Higher resolution for premium quality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Failed to get canvas context');
      
      // Enable high DPI rendering
      const dpr = window.devicePixelRatio || 2;
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
      ctx.scale(dpr, dpr);
      
      const baseSize = canvasSize;
      
      // Ultra-premium gradient background (subtle)
      const gradient = ctx.createLinearGradient(0, 0, baseSize, baseSize);
      gradient.addColorStop(0, '#FAFAFA');
      gradient.addColorStop(0.5, '#FFFFFF');
      gradient.addColorStop(1, '#F9FAFB');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, baseSize, baseSize);
      
      // Subtle texture pattern overlay (very light)
      ctx.globalAlpha = 0.02;
      for (let i = 0; i < baseSize; i += 4) {
        for (let j = 0; j < baseSize; j += 4) {
          if ((i + j) % 8 === 0) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(i, j, 1, 1);
          }
        }
      }
      ctx.globalAlpha = 1.0;
      
      // Calculate dimensions with perfect spacing
      const padding = baseSize * 0.15; // 15% padding for elegance
      const qrSize = baseSize - (padding * 2);
      const qrX = padding;
      const qrY = padding;
      
      // Generate QR code with high error correction for logo
      // Ensure color is properly formatted (should be hex format like #RRGGBB)
      const qrColor = color.startsWith('#') ? color : `#${color}`;
      
      const qrDataUrl = await QRCode.toDataURL(cardUrl, {
        width: qrSize * dpr,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction for logo overlay
      });
      
      // Load QR code image
      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });
      
      // Create shadow layer for QR code (sophisticated depth)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = baseSize * 0.03;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = baseSize * 0.008;
      
      // Draw QR code with rounded corners effect (soft edges)
      const cornerRadius = baseSize * 0.02;
      drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, cornerRadius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
      
      // Draw QR code on white background
      ctx.save();
      drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, cornerRadius);
      ctx.clip();
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      ctx.restore();
      
      // Sophisticated multi-layer border
      // Outer subtle glow
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = baseSize * 0.004;
      drawRoundedRect(ctx, qrX - baseSize * 0.01, qrY - baseSize * 0.01, qrSize + baseSize * 0.02, qrSize + baseSize * 0.02, cornerRadius * 1.2);
      ctx.stroke();
      ctx.restore();
      
      // Main border
      ctx.save();
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = baseSize * 0.003;
      drawRoundedRect(ctx, qrX - baseSize * 0.005, qrY - baseSize * 0.005, qrSize + baseSize * 0.01, qrSize + baseSize * 0.01, cornerRadius * 1.1);
      ctx.stroke();
      ctx.restore();
      
      // Optional: Add logo/avatar in center with premium styling
      if (cardData?.avatar_url || cardData?.company_logo_url) {
        const logoUrl = cardData?.avatar_url || cardData?.company_logo_url;
        if (logoUrl) {
          try {
            const logoImage = new Image();
            logoImage.crossOrigin = 'anonymous';
            
            // Construct full URL if needed
            let fullLogoUrl = logoUrl;
            if (!logoUrl.startsWith('http')) {
              if (logoUrl.includes('avatars/')) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(logoUrl.replace('avatars/', ''));
                fullLogoUrl = data?.publicUrl || logoUrl;
              } else if (logoUrl.includes('company-logos/')) {
                const { data } = supabase.storage.from('company-logos').getPublicUrl(logoUrl.replace('company-logos/', ''));
                fullLogoUrl = data?.publicUrl || logoUrl;
              } else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(logoUrl);
                fullLogoUrl = data?.publicUrl || logoUrl;
              }
            }
            
            await new Promise((resolve, reject) => {
              logoImage.onload = resolve;
              logoImage.onerror = reject;
              logoImage.src = fullLogoUrl;
            });
            
            const logoSize = qrSize * 0.20; // 20% of QR code size
            const logoCenterX = qrX + qrSize / 2;
            const logoCenterY = qrY + qrSize / 2;
            const logoRadius = logoSize / 2;
            
            ctx.save();
            
            // Outer glow for logo
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = baseSize * 0.015;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = baseSize * 0.005;
            
            // Premium white circle with subtle gradient
            const logoGradient = ctx.createRadialGradient(
              logoCenterX, logoCenterY, 0,
              logoCenterX, logoCenterY, logoRadius + baseSize * 0.01
            );
            logoGradient.addColorStop(0, '#FFFFFF');
            logoGradient.addColorStop(1, '#F9FAFB');
            
            ctx.beginPath();
            ctx.arc(logoCenterX, logoCenterY, logoRadius + baseSize * 0.008, 0, Math.PI * 2);
            ctx.fillStyle = logoGradient;
            ctx.fill();
            
            // Elegant border for logo circle
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = baseSize * 0.004;
            ctx.beginPath();
            ctx.arc(logoCenterX, logoCenterY, logoRadius + baseSize * 0.008, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
            
            // Draw logo with clipping
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
              logoImage, 
              logoCenterX - logoRadius, 
              logoCenterY - logoRadius, 
              logoSize, 
              logoSize
            );
            ctx.restore();
          } catch (logoError) {
            // Logo failed to load, continue without it
          }
        }
      }
      
      // Premium typography section at the bottom
      const textSectionY = baseSize - padding * 0.5;
      const displayName = customName || cardData?.name || 'Carte de visite';
      
      // Set font for text measurement
      ctx.save();
      ctx.font = `300 ${baseSize * 0.032}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.letterSpacing = '-0.02em';
      
      // Title with perfect typography
      ctx.fillStyle = '#111827';
      
      // Subtle text shadow for depth
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = baseSize * 0.008;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillText(displayName, baseSize / 2, textSectionY);
      ctx.restore();
      
      // Optional: Add subtle subtitle (company/title) with logo
      if (cardData?.company || cardData?.title) {
        const subtitle = cardData?.company || cardData?.title || '';
        const hasCompanyLogo = cardData?.company_logo_url;
        
        if (hasCompanyLogo) {
          try {
            const companyLogoImage = new Image();
            companyLogoImage.crossOrigin = 'anonymous';
            
            // Construct full URL if needed
            let fullCompanyLogoUrl = cardData.company_logo_url;
            if (!fullCompanyLogoUrl.startsWith('http')) {
              if (fullCompanyLogoUrl.includes('avatars/')) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fullCompanyLogoUrl.replace('avatars/', ''));
                fullCompanyLogoUrl = data?.publicUrl || fullCompanyLogoUrl;
              } else if (fullCompanyLogoUrl.includes('company-logos/')) {
                const { data } = supabase.storage.from('company-logos').getPublicUrl(fullCompanyLogoUrl.replace('company-logos/', ''));
                fullCompanyLogoUrl = data?.publicUrl || fullCompanyLogoUrl;
              } else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fullCompanyLogoUrl);
                fullCompanyLogoUrl = data?.publicUrl || fullCompanyLogoUrl;
              }
            }
            
            await new Promise((resolve, reject) => {
              companyLogoImage.onload = resolve;
              companyLogoImage.onerror = reject;
              companyLogoImage.src = fullCompanyLogoUrl;
            });
            
            // Calculate dimensions for logo and text
            // Set font first to measure text
            ctx.save();
            ctx.font = `300 ${baseSize * 0.018}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
            const textWidth = ctx.measureText(subtitle).width;
            ctx.restore();
            
            const logoSize = baseSize * 0.025; // Logo size
            const textY = textSectionY + baseSize * 0.045;
            const spacing = baseSize * 0.01; // Spacing between logo and text
            const totalWidth = logoSize + spacing + textWidth;
            const startX = (baseSize - totalWidth) / 2;
            
            // Draw logo
            ctx.save();
            ctx.drawImage(
              companyLogoImage,
              startX,
              textY - logoSize / 2,
              logoSize,
              logoSize
            );
            ctx.restore();
            
            // Draw text next to logo
            ctx.save();
            ctx.fillStyle = '#6B7280';
            ctx.font = `300 ${baseSize * 0.018}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.letterSpacing = '0.01em';
            ctx.fillText(subtitle, startX + logoSize + spacing, textY);
            ctx.restore();
          } catch (logoError) {
            // If logo fails, fallback to text only
            ctx.save();
            ctx.fillStyle = '#6B7280';
            ctx.font = `300 ${baseSize * 0.018}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.letterSpacing = '0.01em';
            ctx.fillText(subtitle, baseSize / 2, textSectionY + baseSize * 0.045);
            ctx.restore();
          }
        } else {
          // No logo, just text
          ctx.save();
          ctx.fillStyle = '#6B7280';
          ctx.font = `300 ${baseSize * 0.018}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.letterSpacing = '0.01em';
          ctx.fillText(subtitle, baseSize / 2, textSectionY + baseSize * 0.045);
          ctx.restore();
        }
      }
      
      // Discreet watermark/branding (very subtle)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = `300 ${baseSize * 0.012}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.letterSpacing = '0.05em';
      ctx.fillText('booh', baseSize / 2, baseSize - padding * 0.15);
      ctx.restore();
      
      // Convert canvas to blob with maximum quality
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-${(customName || cardData?.name || 'card').replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: t('qrCode.toasts.downloaded'),
          description: t('qrCode.toasts.downloadedDescription'),
        });
      }, 'image/png', 1.0);
      
    } catch (error: any) {
      console.error('Error downloading QR code:', error);
      toast({
        title: t('qrCode.errors.error'),
        description: t('qrCode.errors.downloadError'),
        variant: "destructive",
      });
    }
  };

  const copyShareLink = async () => {
    if (!id) return;
    
    try {
      const baseUrl = window.location.origin;
      const shareUrl = generateCardUrl(id, cardData?.slug);
      
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      
      toast({
        title: t('qrCode.toasts.linkCopied'),
        description: t('qrCode.toasts.linkCopiedDescription'),
      });
      
      // Reset copy success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Error log removed
      toast({
        title: t('qrCode.errors.error'),
        description: t('qrCode.errors.copyError'),
        variant: "destructive",
      });
    }
  };


  // If user is not logged in, redirect to login page
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <QrCodeIcon className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('qrCode.title') || 'QR Code'}
                  </h1>
                  <p
                    className="text-sm md:text-base text-gray-600 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('qrCode.description') || 'Générez et personnalisez votre QR code pour partager votre carte'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-gray-900 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* QR Code Preview */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Premium Badge */}
                {cardData?.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-light shadow-sm z-30"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('qrCode.premium') || 'Premium'}
                  </div>
                )}
                
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('qrCode.preview') || 'Aperçu du QR Code'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('qrCode.previewDescription') || 'Visualisez votre QR code personnalisé'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                    {qrCodeUrl ? (
                      <div className="relative bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                        <img 
                          src={qrCodeUrl}
                          alt={t('qrCode.alt') || 'QR Code'}
                          className="max-w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-12 sm:p-16 w-full max-w-xs aspect-square flex items-center justify-center border border-gray-200">
                        <QrCodeIcon className="h-20 w-20 sm:h-24 sm:w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {qrCodeUrl && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={downloadQrCode}
                        className="flex-1 h-12 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                        aria-label={t('qrCode.actions.download') || 'Télécharger'}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <Download className="h-5 w-5 mr-2" />
                        {t('qrCode.actions.download') || 'Télécharger'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={copyShareLink}
                        className="flex-1 h-12 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                        aria-label={t('qrCode.actions.copyLink') || 'Copier le lien'}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {copySuccess ? (
                          <span className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-gray-900" />
                            {t('qrCode.actions.linkCopied') || 'Lien copié'}
                          </span>
                        ) : (
                          <>
                            <Share2 className="h-5 w-5 mr-2" />
                            {t('qrCode.actions.copyLink') || 'Copier le lien'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* QR Code Options */}
              <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('qrCode.customization.title') || 'Personnalisation'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('qrCode.customization.description') || 'Personnalisez votre QR code selon vos préférences'}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="card-name" className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('qrCode.customization.customName') || 'Nom personnalisé'}
                      </Label>
                      <Input
                        id="card-name"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder={t('qrCode.customization.customNamePlaceholder') || 'Nom de la carte'}
                        className="h-12 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 rounded-lg shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('qrCode.customization.size') || 'Taille'}
                      </Label>
                      <RadioGroup 
                        value={size} 
                        onValueChange={setSize}
                        className="grid grid-cols-3 gap-3"
                      >
                        {QR_CODE_SIZES.map((sizeOption) => (
                          <div
                            key={sizeOption.value}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem 
                              value={sizeOption.value} 
                              id={`size-${sizeOption.value}`} 
                              className="focus:ring-1 focus:ring-gray-900/20 border border-gray-200"
                            />
                            <Label 
                              htmlFor={`size-${sizeOption.value}`}
                              className="text-sm font-light text-gray-700 cursor-pointer"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {sizeOption.label || sizeOption.value.charAt(0).toUpperCase() + sizeOption.value.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-light text-gray-700 mb-2 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('qrCode.customization.color') || 'Couleur'}
                      </Label>
                      <div className="relative">
                        <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Aperçu de la couleur sélectionnée */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shadow-sm border border-gray-200 relative"
                              style={{ backgroundColor: color }}
                            />
                            {/* Indicateur de couleur sélectionnée */}
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-900 shadow-sm flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            </div>
                          </div>
                          
                          {/* Color Picker stylé avec Popover */}
                          <div className="flex-1">
                            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-full h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center gap-2 cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-all"
                                >
                                  <div
                                    className="w-8 h-8 rounded-lg shadow-sm border border-white"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-sm font-light text-gray-700 uppercase tracking-wider"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {color}
                                  </span>
                                  <Palette className="w-5 h-5 text-gray-400 ml-auto" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-80 p-0 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden"
                                align="start"
                                sideOffset={8}
                              >
                                <div className="p-4 space-y-4">
                                  {/* Palette de couleurs principale */}
                                  <div className="relative">
                                    <div
                                      className="w-full h-40 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden cursor-crosshair"
                                      style={{
                                        background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
                                      }}
                                      onMouseDown={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        const s = Math.round((x / rect.width) * 100);
                                        const l = Math.round(100 - (y / rect.height) * 100);
                                        updateColorFromHsl(hue, s, l);
                                      }}
                                      onMouseMove={(e) => {
                                        if (e.buttons === 1) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const x = e.clientX - rect.left;
                                          const y = e.clientY - rect.top;
                                          const s = Math.round((x / rect.width) * 100);
                                          const l = Math.round(100 - (y / rect.height) * 100);
                                          updateColorFromHsl(hue, s, l);
                                        }
                                      }}
                                    >
                                      {/* Curseur de sélection */}
                                      <div
                                        className="absolute w-4 h-4 rounded-full border border-white shadow-sm pointer-events-none"
                                        style={{
                                          left: `${saturation}%`,
                                          top: `${100 - lightness}%`,
                                          transform: 'translate(-50%, -50%)',
                                          backgroundColor: color
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Slider de teinte (Hue) */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-light text-gray-700"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      Teinte (Hue)
                                    </Label>
                                    <div className="relative h-6 rounded-lg overflow-hidden border border-gray-200">
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `linear-gradient(to right, 
                                            hsl(0, 100%, 50%), 
                                            hsl(60, 100%, 50%), 
                                            hsl(120, 100%, 50%), 
                                            hsl(180, 100%, 50%), 
                                            hsl(240, 100%, 50%), 
                                            hsl(300, 100%, 50%), 
                                            hsl(360, 100%, 50%))`
                                        }}
                                      />
                                      <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={hue}
                                        onChange={(e) => {
                                          const newHue = parseInt(e.target.value);
                                          setHue(newHue);
                                          updateColorFromHsl(newHue, saturation, lightness);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      />
                                      <div
                                        className="absolute top-0 bottom-0 w-1 bg-white border border-gray-900 shadow-sm pointer-events-none"
                                        style={{ left: `${(hue / 360) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Input hex */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-light text-gray-700"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      Code hexadécimal
                                    </Label>
                                    <Input
                                      type="text"
                                      value={color}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                          setColor(value);
                                        }
                                      }}
                                      className="h-10 font-mono text-sm font-light uppercase tracking-wider border border-gray-200 focus:ring-1 focus:ring-gray-900/20 rounded-lg"
                                      placeholder="#000000"
                                    />
                                  </div>
                                  
                                  {/* Couleurs rapides (presets) */}
                                  <div className="pt-3 border-t border-gray-200">
                                    <p className="text-xs font-light text-gray-500 mb-3 uppercase tracking-wider"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {t('qrCode.customization.quickColors') || 'Couleurs rapides'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {QR_CODE_COLORS.map((colorOption) => (
                                        <button
                                          key={colorOption.value}
                                          type="button"
                                          className={`relative w-10 h-10 rounded-lg border transition-all duration-200 shadow-sm ${
                                            color === colorOption.value 
                                              ? 'border-gray-900 ring-1 ring-gray-900' 
                                              : 'border-gray-200 hover:border-gray-300'
                                          }`}
                                          onClick={() => setColor(colorOption.value)}
                                          aria-label={colorOption.label || colorOption.value}
                                          style={{ backgroundColor: colorOption.value }}
                                        >
                                          {color === colorOption.value && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <Check className="h-5 w-5 text-white drop-shadow-sm" />
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <Button
                      onClick={generateQrCode}
                      disabled={generating}
                      className="w-full h-12 md:h-14 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light shadow-sm"
                      aria-label={t('qrCode.actions.generate') || 'Générer'}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {generating ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t('qrCode.actions.generating') || 'Génération...'}
                        </span>
                      ) : (
                        <>
                          <QrCodeIcon className="h-5 w-5 mr-2" />
                          {t('qrCode.actions.generate') || 'Générer le QR Code'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QrCode;
