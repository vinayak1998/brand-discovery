import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuickSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export const QuickSurveyModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Send',
}: QuickSurveyModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <Card className="w-full max-w-md bg-background border-border shadow-lg animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
            aria-label="Close survey"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Skip for now
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : submitLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
};
