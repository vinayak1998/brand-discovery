import { useState } from 'react';
import { QuickSurveyModal } from './QuickSurveyModal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface TileRankerSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<boolean>;
}

export const TileRankerSurvey = ({ isOpen, onClose, onSubmit }: TileRankerSurveyProps) => {
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!q1) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        q1_priority_theme: q1,
        q2_desired_additions: q2,
      });
      // Reset form
      setQ1('');
      setQ2([]);
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
    { value: 'product_ideas', label: 'Product ideas' },
    { value: 'hook_ideas', label: 'Hook ideas' },
    { value: 'peer_examples', label: 'Peer examples' },
    { value: 'commission_info', label: 'Commission info' },
  ];

  return (
    <QuickSurveyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Which matters most?"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Which matters most right now?
          </Label>
          <RadioGroup value={q1} onValueChange={setQ1}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trending" id="theme-trending" />
              <Label htmlFor="theme-trending" className="font-normal cursor-pointer">
                Trending
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="best_reach" id="theme-reach" />
              <Label htmlFor="theme-reach" className="font-normal cursor-pointer">
                Best Reach
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fastest_selling" id="theme-selling" />
              <Label htmlFor="theme-selling" className="font-normal cursor-pointer">
                Fastest Selling
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            What would you add? (Select all that apply)
          </Label>
          <div className="space-y-2">
            {q2Options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`add-${option.value}`}
                  checked={q2.includes(option.value)}
                  onCheckedChange={() => toggleQ2Option(option.value)}
                />
                <Label
                  htmlFor={`add-${option.value}`}
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </QuickSurveyModal>
  );
};
