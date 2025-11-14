import { useState } from 'react';
import { QuickSurveyModal } from './QuickSurveyModal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface OutcomeSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<boolean>;
}

export const OutcomeSurvey = ({ isOpen, onClose, onSubmit }: OutcomeSurveyProps) => {
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!q1 || !q2) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        q1_action: q1,
        q2_relevance: parseInt(q2),
      });
      // Reset form
      setQ1('');
      setQ2('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <QuickSurveyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick feedback"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Did you create a link or shortlist?
          </Label>
          <RadioGroup value={q1} onValueChange={setQ1}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="created_link" id="action-link" />
              <Label htmlFor="action-link" className="font-normal cursor-pointer">
                Created link
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shortlisted" id="action-shortlist" />
              <Label htmlFor="action-shortlist" className="font-normal cursor-pointer">
                Shortlisted
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="browsing" id="action-browse" />
              <Label htmlFor="action-browse" className="font-normal cursor-pointer">
                Just browsing
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            How relevant were these picks?
          </Label>
          <RadioGroup value={q2} onValueChange={setQ2}>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex flex-col items-center gap-1">
                  <RadioGroupItem
                    value={rating.toString()}
                    id={`rating-${rating}`}
                    className="h-10 w-10"
                  />
                  <Label
                    htmlFor={`rating-${rating}`}
                    className="text-xs font-normal cursor-pointer"
                  >
                    {rating}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Not relevant</span>
              <span>Very relevant</span>
            </div>
          </RadioGroup>
        </div>
      </div>
    </QuickSurveyModal>
  );
};
