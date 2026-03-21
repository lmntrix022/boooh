/**
 * EventPhotoGallery Component
 * Interactive photo gallery for event images
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Download,
  Maximize2,
} from 'lucide-react';
import { OptimizedEventImage } from './OptimizedEventImage';

interface EventPhotoGalleryProps {
  images: string[];
  coverImage?: string;
  eventTitle?: string;
}

export const EventPhotoGallery: React.FC<EventPhotoGalleryProps> = ({
  images,
  coverImage,
  eventTitle = 'Event',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const allImages = coverImage ? [coverImage, ...images] : images;

  if (allImages.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setIsFullscreen(false);
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === 0 ? allImages.length - 1 : selectedIndex - 1);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === allImages.length - 1 ? 0 : selectedIndex + 1);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_image_${selectedIndex! + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Gallery Grid */}
      {allImages.length === 1 ? (
        // Single image
        <Card
          className="relative overflow-hidden aspect-video cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <OptimizedEventImage
            src={allImages[0]}
            alt={`${eventTitle} - Image 1`}
            className="w-full h-full transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Card>
      ) : allImages.length === 2 ? (
        // Two images
        <div className="grid grid-cols-2 gap-2">
          {allImages.map((image, index) => (
            <Card
              key={index}
              className="relative overflow-hidden aspect-video cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <OptimizedEventImage
                src={image}
                alt={`${eventTitle} - Image ${index + 1}`}
                className="w-full h-full transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Three or more images - Featured layout
        <div className="grid grid-cols-4 gap-2">
          {/* Large featured image */}
          <Card
            className="col-span-4 md:col-span-2 md:row-span-2 relative overflow-hidden aspect-video md:aspect-auto cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <OptimizedEventImage
              src={allImages[0]}
              alt={`${eventTitle} - Image 1`}
              className="w-full h-full transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Card>

          {/* Smaller images */}
          {allImages.slice(1, 5).map((image, index) => (
            <Card
              key={index + 1}
              className="col-span-2 md:col-span-1 relative overflow-hidden aspect-square cursor-pointer group"
              onClick={() => openLightbox(index + 1)}
            >
              <img
                src={image}
                alt={`${eventTitle} - Image ${index + 2}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {index === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{allImages.length - 5} more
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent
          className={`max-w-7xl p-0 ${isFullscreen ? 'w-screen h-screen max-w-none' : ''}`}
        >
          <AnimatePresence mode="wait">
            {selectedIndex !== null && (
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                {/* Image */}
                <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[80vh]'} bg-black/90 flex items-center justify-center`}>
                  <img
                    src={allImages[selectedIndex]}
                    alt={`${eventTitle} - Image ${selectedIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Navigation Buttons */}
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPrevious();
                        }}
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNext();
                        }}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </Button>
                    </>
                  )}

                  {/* Top Controls */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => handleDownload(allImages[selectedIndex])}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={closeLightbox}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                    {selectedIndex + 1} / {allImages.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {allImages.length > 1 && !isFullscreen && (
                  <div className="p-4 bg-white">
                    <div className="flex gap-2 overflow-x-auto">
                      {allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedIndex
                              ? 'border-purple-500 ring-2 ring-purple-200'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};
