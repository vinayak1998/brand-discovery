import { useState } from 'react';
import { QuickSurveyModal } from './QuickSurveyModal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface IntentSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<boolean>;
  brandName: string;
  categories?: string[];
}

export const IntentSurvey = ({
  isOpen,
  onClose,
  onSubmit,
  brandName,
  categories = [],
}: IntentSurveyProps) => {
  const [q1, setQ1] = useState<string>('');
  const [q2Barriers, setQ2Barriers] = useState<string[]>([]);
  const [q2Category, setQ2Category] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!q1) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        q1_intent: q1,
        q2_barriers: q1 === 'yes' ? null : q2Barriers,
        q2_category: q1 === 'yes' ? q2Category : null,
      });
      // Reset form
      setQ1('');
      setQ2Barriers([]);
      setQ2Category('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBarrier = (value: string) => {
    setQ2Barriers((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      // Max 2 selections
      if (prev.length >= 2) {
        return [...prev.slice(1), value];
      }
      return [...prev, value];
    });
  };

  const barrierOptions = [
    { value: 'not_on_brand', label: 'Not on-brand' },
    { value: 'low_trust', label: 'Low trust' },
    { value: 'unsure_reach', label: 'Unsure reach' },
    { value: 'prices', label: 'Prices' },
    { value: 'didnt_like_products', label: "Didn't like products" },
    { value: 'need_sourcing', label: 'Need sourcing' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <QuickSurveyModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Will you post ${brandName}?`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Will you post {brandName} this week?
          </Label>
          <RadioGroup value={q1} onValueChange={setQ1}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="intent-yes" />
              <Label htmlFor="intent-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="maybe" id="intent-maybe" />
              <Label htmlFor="intent-maybe" className="font-normal cursor-pointer">
                Maybe
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="intent-no" />
              <Label htmlFor="intent-no" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 - Barriers (if Maybe/No) */}
        {(q1 === 'maybe' || q1 === 'no') && (
          <div className="space-y-3">
            <Label className="text-base font-medium">
              What's stopping you? (Choose up to 2)
            </Label>
            <div className="space-y-2">
              {barrierOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`barrier-${option.value}`}
                    checked={q2Barriers.includes(option.value)}
                    onCheckedChange={() => toggleBarrier(option.value)}
                    disabled={
                      !q2Barriers.includes(option.value) && q2Barriers.length >= 2
                    }
                  />
                  <Label
                    htmlFor={`barrier-${option.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {q2Barriers.length >= 2 && (
              <p className="text-xs text-muted-foreground">
                Maximum 2 selections reached
              </p>
            )}
          </div>
        )}

        {/* Q2 - Category (if Yes) */}
        {q1 === 'yes' && categories.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Which category are you likely to pick?
            </Label>
            <RadioGroup value={q2Category} onValueChange={setQ2Category}>
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <RadioGroupItem value={category} id={`cat-${category}`} />
                  <Label
                    htmlFor={`cat-${category}`}
                    className="font-normal cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    </QuickSurveyModal>
  );
};
