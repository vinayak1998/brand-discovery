import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface SurveySectionProps {
  creatorId: string;
  onSubmit?: (data: SurveyData) => void;
}

interface SurveyData {
  timestamp: string;
  creator_id: string;
  q1_useful: string;
  q2_intent: string;
  q3_themes: string;
}

const themeOptions = [
  { id: "top_trending", icon: "🏆", label: "Top Trending" },
  { id: "best_reach", icon: "📈", label: "Best Reach" },
  { id: "fastest_selling", icon: "⚡", label: "Fastest Selling" },
  { id: "highest_commission", icon: "💰", label: "Highest Commission" },
];

const SurveySection = ({ creatorId, onSubmit }: SurveySectionProps) => {
  const [q1Answer, setQ1Answer] = useState<string>("");
  const [q2Answer, setQ2Answer] = useState<string>("");
  const [q3Answers, setQ3Answers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleQ3Change = (themeId: string, checked: boolean) => {
    if (checked) {
      setQ3Answers(prev => [...prev, themeId]);
    } else {
      setQ3Answers(prev => prev.filter(id => id !== themeId));
    }
  };

  const handleSubmit = async () => {
    if (!q1Answer || !q2Answer) {
      toast({
        title: "Please answer all questions",
        description: "Both rating questions are required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const surveyData: SurveyData = {
      timestamp: new Date().toISOString(),
      creator_id: creatorId,
      q1_useful: q1Answer,
      q2_intent: q2Answer,
      q3_themes: q3Answers.map(id => themeOptions.find(opt => opt.id === id)?.label || id).join(", ")
    };

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit?.(surveyData);
      
      toast({
        title: "Feedback submitted!",
        description: "Thanks! Your feedback helps us improve your recommendations."
      });
      
      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 text-center bg-card border-border">
        <div className="py-8">
          <div className="text-4xl mb-4">🙏</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Thank you for your feedback!</h3>
          <p className="text-muted-foreground">Your input helps us improve your recommendations.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Share Your Feedback</h3>
          <p className="text-muted-foreground">Help us improve your brand recommendations</p>
        </div>

        {/* Question 1 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Did you find these insights useful?</Label>
          <RadioGroup value={q1Answer} onValueChange={setQ1Answer}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="q1-yes" />
              <Label htmlFor="q1-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="q1-no" />
              <Label htmlFor="q1-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 2 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Do you plan to create more content based on these recommended brands?</Label>
          <RadioGroup value={q2Answer} onValueChange={setQ2Answer}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="q2-yes" />
              <Label htmlFor="q2-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Maybe" id="q2-maybe" />
              <Label htmlFor="q2-maybe">Maybe</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="q2-no" />
              <Label htmlFor="q2-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 3 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Which of these insights did you find most useful? (Select multiple)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {themeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`q3-${option.id}`}
                  checked={q3Answers.includes(option.id)}
                  onCheckedChange={(checked) => handleQ3Change(option.id, checked as boolean)}
                />
                <Label htmlFor={`q3-${option.id}`} className="flex items-center gap-2 cursor-pointer">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !q1Answer || !q2Answer}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-3"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </Card>
  );
};

export default SurveySection;