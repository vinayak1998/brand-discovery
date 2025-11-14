import { useState } from 'react';
import { QuickSurveyModal } from './QuickSurveyModal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface DiscoverySurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<boolean>;
}

export const DiscoverySurvey = ({ isOpen, onClose, onSubmit }: DiscoverySurveyProps) => {
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string[]>([]);
  const [q3, setQ3] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!q1) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        q1_helpful: q1,
        q2_mattered_most: q2,
        q3_missing: q3 || null,
      });
      // Reset form
      setQ1('');
      setQ2([]);
      setQ3('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQ2Option = (value: string) => {
    setQ2((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const q2Options = [
    { value: 'trending', label: 'Trending' },
    { value: 'fast_selling', label: 'Fast-selling' },
    { value: 'reach', label: 'Reach' },
    { value: 'price_commission', label: 'Price/Commission' },
    { value: 'brand_fit', label: 'Brand fit' },
  ];

  return (
    <QuickSurveyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Help us tune your picks"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Did these picks help you decide what to post?
          </Label>
          <RadioGroup value={q1} onValueChange={setQ1}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="q1-yes" />
              <Label htmlFor="q1-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somewhat" id="q1-somewhat" />
              <Label htmlFor="q1-somewhat" className="font-normal cursor-pointer">
                Somewhat
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_really" id="q1-not-really" />
              <Label htmlFor="q1-not-really" className="font-normal cursor-pointer">
                Not really
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            What mattered most? (Select all that apply)
          </Label>
          <div className="space-y-2">
            {q2Options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`q2-${option.value}`}
                  checked={q2.includes(option.value)}
                  onCheckedChange={() => toggleQ2Option(option.value)}
                />
                <Label
                  htmlFor={`q2-${option.value}`}
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div className="space-y-3">
          <Label htmlFor="q3-missing" className="text-base font-medium">
            What was missing? (Optional, max 100 characters)
          </Label>
          <Textarea
            id="q3-missing"
            value={q3}
            onChange={(e) => setQ3(e.target.value.slice(0, 100))}
            placeholder="Tell us what would make this better..."
            className="resize-none"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground text-right">
            {q3.length}/100
          </p>
        </div>
      </div>
    </QuickSurveyModal>
  );
};
