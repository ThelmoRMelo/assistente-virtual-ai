// ProductGalleryViewer.tsx - Galeria de imagens com swipe (mobile-first)
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ProductGalleryViewerProps {
  coverImage: string;
  galleryImages: string[];
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function ProductGalleryViewer({
  coverImage,
  galleryImages,
  productName,
  open,
  onOpenChange,
  initialIndex = 0,
}: ProductGalleryViewerProps) {
  const allImages = [coverImage, ...galleryImages].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to initial index when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Min swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < allImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < allImages.length) {
      setCurrentIndex(index);
    }
  }, [allImages.length]);

  const goNext = () => goTo(currentIndex + 1);
  const goPrev = () => goTo(currentIndex - 1);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') onOpenChange(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, goTo, onOpenChange]);

  if (allImages.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <VisuallyHidden>
          <DialogTitle>Galeria de imagens - {productName}</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image counter */}
        <div className="absolute top-4 left-4 z-50 px-3 py-1.5 bg-black/50 rounded-full text-white text-sm font-medium">
          {currentIndex + 1} / {allImages.length}
        </div>

        {/* Main image container */}
        <div
          ref={containerRef}
          className="relative w-full h-[80vh] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Navigation arrows - desktop */}
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-4 z-40 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors hidden sm:block"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {currentIndex < allImages.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 z-40 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors hidden sm:block"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[currentIndex]}
            alt={`${productName} - Imagem ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-full">
            {allImages.map((img, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white scale-110' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Swipe hint - mobile only */}
        {allImages.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs sm:hidden">
            Deslize para navegar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Mini gallery preview for product cards
interface ProductGalleryPreviewProps {
  coverImage: string;
  galleryImages: string[];
  productName: string;
  onOpenGallery: (index: number) => void;
}

export function ProductGalleryPreview({
  coverImage,
  galleryImages,
  productName,
  onOpenGallery,
}: ProductGalleryPreviewProps) {
  const allImages = [coverImage, ...galleryImages].filter(Boolean);
  const hasGallery = galleryImages.length > 0;

  if (!coverImage) return null;

  return (
    <div className="relative">
      {/* Main cover image */}
      <button
        onClick={() => onOpenGallery(0)}
        className="w-full aspect-video rounded-xl overflow-hidden bg-muted relative group"
      >
        <img
          src={coverImage}
          alt={productName}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Zoom hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 rounded-full">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Gallery indicator */}
        {hasGallery && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-full text-white text-xs font-medium flex items-center gap-1">
            <ZoomIn className="w-3 h-3" />
            +{galleryImages.length}
          </div>
        )}
      </button>

      {/* Gallery thumbnails preview */}
      {hasGallery && (
        <div className="flex gap-1 mt-2">
          {galleryImages.slice(0, 4).map((img, index) => (
            <button
              key={index}
              onClick={() => onOpenGallery(index + 1)}
              className="flex-1 aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity relative"
            >
              <img
                src={img}
                alt={`${productName} - ${index + 2}`}
                className="w-full h-full object-cover"
              />
              {index === 3 && galleryImages.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
                  +{galleryImages.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
