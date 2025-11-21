import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useGATracking } from '@/hooks/useGATracking';

interface ReelsDialogProps {
  reelUrls: string[];
  productName: string;
  productId: number;
  brandId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId?: number | null;
}

const getEmbedUrl = (url: string): string => {
  // Convert Instagram URL to embed format
  // https://www.instagram.com/reel/CODE/ → https://www.instagram.com/reel/CODE/embed/
  const trimmedUrl = url.trim();
  return trimmedUrl.endsWith('/') ? `${trimmedUrl}embed/` : `${trimmedUrl}/embed/`;
};

export const ReelsDialog = ({ 
  reelUrls, 
  productName, 
  productId,
  brandId,
  open, 
  onOpenChange,
  creatorId 
}: ReelsDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const { trackCustomEvent } = useGATracking(creatorId);

  // Defensive check - ensure reelUrls is actually an array
  const safeReelUrls = useMemo(() => {
    if (!reelUrls) return [];
    if (!Array.isArray(reelUrls)) {
      console.error('reelUrls is not an array:', reelUrls);
      return [];
    }
    return reelUrls.filter(url => typeof url === 'string' && url.trim().length > 0);
  }, [reelUrls]);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % safeReelUrls.length;
    setCurrentIndex(nextIndex);
    setEmbedError(false);
    trackCustomEvent('reel_navigation', {
      product_id: productId,
      brand_id: brandId,
      reel_index: nextIndex,
      direction: 'next',
    });
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + safeReelUrls.length) % safeReelUrls.length;
    setCurrentIndex(prevIndex);
    setEmbedError(false);
    trackCustomEvent('reel_navigation', {
      product_id: productId,
      brand_id: brandId,
      reel_index: prevIndex,
      direction: 'previous',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setCurrentIndex(0);
      setEmbedError(false);
    }
  };

  if (safeReelUrls.length === 0) return null;

  const currentReelUrl = safeReelUrls[currentIndex];
  const embedUrl = getEmbedUrl(currentReelUrl);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold line-clamp-1">{productName}</DialogTitle>
        </DialogHeader>

        {/* Reel Display */}
        <div className="relative w-full aspect-[9/16] bg-muted">
          {!embedError ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              onError={() => setEmbedError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load reel
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentReelUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Instagram
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {safeReelUrls.length > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={safeReelUrls.length === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Dots indicator */}
            <div className="flex items-center gap-1.5">
              {safeReelUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setEmbedError(false);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-primary w-4' 
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to reel ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={safeReelUrls.length === 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Reel counter */}
        <div className="px-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">
            Reel {currentIndex + 1} of {safeReelUrls.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
