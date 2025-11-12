import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { tourSteps } from '@/config/tourSteps';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

interface OnboardingTourProps {
  currentStep: number;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export const OnboardingTour = ({
  currentStep,
  isActive,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: OnboardingTourProps) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, position: 'bottom' as 'top' | 'bottom' });

  const step = tourSteps[currentStep];
  const isModalStep = step?.action === 'modal';

  useEffect(() => {
    if (!step || !isActive || isModalStep) return;

    const findAndPositionTarget = () => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Default positioning
        let top = rect.top + scrollTop;
        let left = rect.left + scrollLeft;
        let position: 'top' | 'bottom' = 'bottom';
        
        // Smart positioning: prefer top on mobile for large elements
        const isMobile = viewportWidth < 768;
        const elementTooTall = rect.height > viewportHeight * 0.4;
        
        if (isMobile && elementTooTall) {
          // Position at top of viewport for tall elements on mobile
          position = 'top';
          top = rect.top + scrollTop + 60; // Small offset from top
          left = viewportWidth / 2;
        } else {
          // Check if there's space below
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          if (spaceBelow < 200 && spaceAbove > spaceBelow) {
            position = 'top';
            top = rect.top + scrollTop - 10;
          } else {
            position = 'bottom';
            top = rect.bottom + scrollTop + 10;
          }
          left = rect.left + scrollLeft + rect.width / 2;
        }
        
        setTooltipPosition({ top, left, position });
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    findAndPositionTarget();
    window.addEventListener('resize', findAndPositionTarget);
    return () => window.removeEventListener('resize', findAndPositionTarget);
  }, [step, currentStep, isActive, isModalStep]);

  const handleNext = () => {
    if (currentStep === tourSteps.length - 1) {
      onComplete();
    } else {
      onNext();
    }
  };

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActive, onSkip]);

  if (!isActive || !step) return null;

  // Modal steps (welcome and complete) - now as compact overlays
  if (isModalStep) {
    return (
      <>
        {/* Backdrop - dismissable */}
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onSkip} />
        
        {/* Compact welcome card */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100vw-2rem)] max-w-sm">
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <button
                onClick={onSkip}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Close tour"
              >
                <X className="w-4 h-4" />
              </button>
              <CardTitle className="text-lg pr-6">{step.title}</CardTitle>
              <CardDescription className="text-sm">
                {step.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="flex gap-2">
                {currentStep === 0 ? (
                  <>
                    <Button onClick={onSkip} variant="outline" size="sm" className="flex-1">
                      Skip
                    </Button>
                    <Button onClick={handleNext} size="sm" className="flex-1">
                      Start
                    </Button>
                  </>
                ) : (
                  <Button onClick={onComplete} size="sm" className="w-full">
                    Done
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Tooltip steps with spotlight
  return (
    <>
      {/* Spotlight overlay - dismissable */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] pointer-events-auto"
        onClick={onSkip}
        style={{
          clipPath: targetElement
            ? `polygon(
                0 0, 
                0 100%, 
                ${targetElement.getBoundingClientRect().left - (step.spotlightPadding || 8)}px 100%, 
                ${targetElement.getBoundingClientRect().left - (step.spotlightPadding || 8)}px ${targetElement.getBoundingClientRect().top - (step.spotlightPadding || 8)}px,
                ${targetElement.getBoundingClientRect().right + (step.spotlightPadding || 8)}px ${targetElement.getBoundingClientRect().top - (step.spotlightPadding || 8)}px,
                ${targetElement.getBoundingClientRect().right + (step.spotlightPadding || 8)}px ${targetElement.getBoundingClientRect().bottom + (step.spotlightPadding || 8)}px,
                ${targetElement.getBoundingClientRect().left - (step.spotlightPadding || 8)}px ${targetElement.getBoundingClientRect().bottom + (step.spotlightPadding || 8)}px,
                ${targetElement.getBoundingClientRect().left - (step.spotlightPadding || 8)}px 100%,
                100% 100%,
                100% 0
              )`
            : undefined,
        }}
      />
      
      {/* Persistent skip button - always accessible */}
      <button
        onClick={onSkip}
        className="fixed top-4 right-4 z-[102] bg-background border border-border rounded-full p-2 shadow-lg hover:bg-accent pointer-events-auto"
        aria-label="Skip tour"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Tooltip */}
      <div
        className={`fixed z-[101] w-[calc(100vw-2rem)] max-w-xs pointer-events-auto`}
        style={{
          top: tooltipPosition.position === 'bottom' ? tooltipPosition.top : undefined,
          bottom: tooltipPosition.position === 'top' ? `calc(100vh - ${tooltipPosition.top}px)` : undefined,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)',
        }}
      >
        <Card className="shadow-xl">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm">{step.title}</CardTitle>
            <CardDescription className="text-xs">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3 px-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex gap-1.5">
                {currentStep > 0 && !isModalStep && tourSteps[currentStep - 1]?.action !== 'modal' && (
                  <Button onClick={onPrevious} variant="outline" size="sm" className="h-7 px-2">
                    <ArrowLeft className="w-3 h-3" />
                  </Button>
                )}
                <Button onClick={handleNext} size="sm" className="h-7 px-3 text-xs">
                  {currentStep === tourSteps.length - 1 ? 'Done' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
