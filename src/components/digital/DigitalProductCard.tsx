import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Download, 
  Music, 
  FileText, 
  Video, 
  Headphones,
  Clock,
  DollarSign,
  Eye,
  ShoppingCart,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DigitalProduct {
  id: string;
  title: string;
  description?: string;
  type: 'music_album' | 'music_track' | 'ebook_pdf' | 'ebook_epub' | 'course_video' | 'course_audio' | 'course_pdf' | 'formation_pack';
  price: number;
  currency: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration?: number;
  file_size?: number;
  format?: string;
  is_free: boolean;
  is_premium: boolean;
  view_count: number;
  download_count: number;
  purchase_count: number;
  preview_duration: number;
}

interface DigitalProductCardProps {
  product: DigitalProduct;
  onPreview: (product: DigitalProduct) => void;
  onPurchase: (product: DigitalProduct) => void;
  onDownload?: (product: DigitalProduct) => void;
  isPurchased?: boolean;
  className?: string;
}

const PRODUCT_TYPE_CONFIG = {
  music_album: { icon: Music, color: 'bg-purple-500', label: 'Album' },
  music_track: { icon: Music, color: 'bg-purple-400', label: 'Titre' },
  ebook_pdf: { icon: FileText, color: 'bg-blue-500', label: 'PDF' },
  ebook_epub: { icon: FileText, color: 'bg-blue-400', label: 'EPUB' },
  course_video: { icon: Video, color: 'bg-red-500', label: 'Vidéo' },
  course_audio: { icon: Headphones, color: 'bg-green-500', label: 'Audio' },
  course_pdf: { icon: FileText, color: 'bg-orange-500', label: 'PDF' },
  formation_pack: { icon: Download, color: 'bg-indigo-500', label: 'Pack' }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const DigitalProductCard: React.FC<DigitalProductCardProps> = ({
  product,
  onPreview,
  onPurchase,
  onDownload,
  isPurchased = false,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const config = PRODUCT_TYPE_CONFIG[product.type];
  const Icon = config.icon;
  
  const handlePreview = () => {
    setIsPlaying(!isPlaying);
    onPreview(product);
  };
  
  const handlePurchase = () => {
    onPurchase(product);
  };
  
  const handleDownload = () => {
    if (onDownload) {
      onDownload(product);
    }
  };
  
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`group ${className}`}
      >
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Thumbnail avec overlay */}
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {product.thumbnail_url ? (
              <img 
                src={product.thumbnail_url} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full ${config.color} flex items-center justify-center`}>
                <Icon className="w-16 h-16 text-white opacity-80" />
              </div>
            )}
            
            {/* Overlay avec contrôles */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handlePreview}
                      className="bg-white/90 hover:bg-white text-gray-800"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPlaying ? 'Arrêter' : 'Prévisualiser'}</p>
                  </TooltipContent>
                </Tooltip>
                
                {isPurchased ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleDownload}
                        className="bg-green-500/90 hover:bg-green-500 text-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Télécharger</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handlePurchase}
                        className="bg-blue-500/90 hover:bg-blue-500 text-white"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Acheter</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              <Badge variant="secondary" className="bg-white/90 text-gray-800">
                {config.label}
              </Badge>
              {product.is_premium && (
                <Badge variant="default" className="bg-yellow-500 text-white">
                  Premium
                </Badge>
              )}
            </div>
            
            {/* Prix */}
            <div className="absolute top-2 right-2">
              <Badge 
                variant={product.is_free ? "secondary" : "default"}
                className={product.is_free ? "bg-green-500 text-white" : "bg-white/90 text-gray-800"}
              >
                {product.is_free ? 'Gratuit' : `${product.price} Fcfa`}
              </Badge>
            </div>
          </div>
          
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
              {product.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Métadonnées */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {product.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(product.duration)}</span>
                </div>
              )}
              {product.file_size && (
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>{formatFileSize(product.file_size)}</span>
                </div>
              )}
              {product.format && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{product.format.toUpperCase()}</span>
                </div>
              )}
            </div>
            
            {/* Statistiques */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{product.view_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{product.download_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" />
                <span>{product.purchase_count}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Prévisualiser
              </Button>
              
              {isPurchased ? (
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handlePurchase}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {product.is_free ? 'Obtenir' : 'Acheter'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};
