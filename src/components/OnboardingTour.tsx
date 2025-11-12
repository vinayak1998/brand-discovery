import { useEffect, useState } from 'react';
import { tourSteps } from '@/config/tourSteps';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isModalStep = step?.action === 'modal';

  useEffect(() => {
    if (!isActive || !step || isModalStep) {
      setTargetElement(null);
      return;
    }

    // Find target element
    const element = document.querySelector(step.target) as HTMLElement;
    if (!element) {
      console.warn(`Tour target not found: ${step.target}`);
      return;
    }

    setTargetElement(element);

    // Calculate tooltip position
    const rect = element.getBoundingClientRect();
    const padding = step.spotlightPadding || 8;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding + window.scrollY;
        left = rect.left + rect.width / 2;
        break;
      case 'top':
        top = rect.top - padding + window.scrollY;
        left = rect.left + rect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.right + padding;
        break;
      case 'left':
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.left - padding;
        break;
      default:
        top = rect.bottom + padding + window.scrollY;
        left = rect.left + rect.width / 2;
    }

    setTooltipPosition({ top, left });

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [step, currentStep, isActive, isModalStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!isActive || !step) return null;

  // Modal steps (welcome and complete)
  if (isModalStep) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in" />

        {/* Modal Dialog */}
        <Dialog open={true} onOpenChange={onSkip}>
          <DialogContent className="z-[101] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription className="text-base pt-2">
                {step.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 sm:gap-2">
              {!isLastStep && (
                <Button variant="ghost" onClick={onSkip} className="flex-1">
                  Skip Tour
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1">
                {isLastStep ? 'Start Exploring' : 'Let\'s Go!'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Tooltip steps
  return (
    <>
      {/* Backdrop with spotlight */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 animate-in fade-in" />
        
        {/* Spotlight cutout */}
        {targetElement && (
          <div
            className="absolute border-4 border-primary rounded-lg animate-in zoom-in shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              top: targetElement.getBoundingClientRect().top + window.scrollY - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.offsetWidth + 16,
              height: targetElement.offsetHeight + 16,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[101] animate-in fade-in zoom-in duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: step.position === 'left' || step.position === 'right' 
            ? 'translateY(-50%)'
            : 'translateX(-50%)',
        }}
      >
        <div className="bg-card border shadow-lg rounded-lg p-4 max-w-xs relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="text-xs text-muted-foreground">
                {currentStep + 1} of {tourSteps.length}
              </div>
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button variant="ghost" size="sm" onClick={onPrevious} className="h-8 text-xs">
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} className="h-8 text-xs">
                  {isLastStep ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
