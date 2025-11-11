import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";

interface SurveySectionProps {
  creatorId: string;
  onSubmit?: (data: SurveyData) => void;
}

interface SurveyData {
  timestamp: string;
  creator_id: string;
  q1_value_rating: number;
  q2_actionability: string;
  q3_themes: string;
  q4_missing_info: string;
  q5_barriers?: string;
  q6_open_feedback?: string;
}

const themeOptions = [
  { id: "top_trending", icon: "🏆", label: "Top Trending" },
  { id: "best_reach", icon: "📈", label: "Best Reach" },
  { id: "fastest_selling", icon: "⚡", label: "Fastest Selling" },
  { id: "highest_commission", icon: "💰", label: "Highest Commission" },
  { id: "none", icon: "❌", label: "None stood out" },
];

const missingInfoOptions = [
  { id: "brand_reviews", label: "Brand reviews" },
  { id: "product_details", label: "Most relevant / best seller product details" },
  { id: "content_inspiration", label: "Top performing content for inspiration" },
  { id: "delivery_timelines", label: "Delivery timelines for sourcing" },
  { id: "commission_rates", label: "Exact commission rates" },
  { id: "payment_timelines", label: "Payment timelines" },
  { id: "other", label: "Others (please specify)" },
];

const barrierOptions = [
  { id: "brand_unknown", label: "Don't know these brands well enough" },
  { id: "never_tried", label: "Never tried / don't like these brands" },
  { id: "not_relevant", label: "Brands not relevant to my audience" },
  { id: "sourcing_problems", label: "Sourcing these products directly / via Wishlink is problematic (e.g., long delivery time)" },
  { id: "need_samples", label: "Need product samples first" },
  { id: "low_earnings", label: "Earnings are too low" },
  { id: "other_marketplace_rewards", label: "Have rewards with other marketplaces which I would prioritize" },
  { id: "other", label: "Others (please specify)" },
];

const SurveySection = ({ creatorId, onSubmit }: SurveySectionProps) => {
  const [q1Rating, setQ1Rating] = useState<number>(0);
  const [q1Hover, setQ1Hover] = useState<number>(0);
  const [q2Answer, setQ2Answer] = useState<string>("");
  const [q3Answers, setQ3Answers] = useState<string[]>([]);
  const [q4Answers, setQ4Answers] = useState<string[]>([]);
  const [q4Other, setQ4Other] = useState<string>("");
  const [q5Answers, setQ5Answers] = useState<string[]>([]);
  const [q5Other, setQ5Other] = useState<string>("");
  const [q6Feedback, setQ6Feedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [surveyStartTracked, setSurveyStartTracked] = useState(false);
  const { toast } = useToast();
  
  const creatorIdNum = parseInt(creatorId);
  const { trackSurveyStart, trackSurveySubmit } = useAnalytics(creatorIdNum);
  
  const showQ5 = q2Answer && ["Neutral", "Unlikely", "Very Unlikely"].includes(q2Answer);
  
  // Track survey start when user starts interacting
  useEffect(() => {
    if (!surveyStartTracked && (q1Rating > 0 || q2Answer || q3Answers.length > 0)) {
      trackSurveyStart();
      setSurveyStartTracked(true);
    }
  }, [q1Rating, q2Answer, q3Answers, surveyStartTracked, trackSurveyStart]);

  const handleQ3Change = (themeId: string, checked: boolean) => {
    if (checked) {
      if (q3Answers.length < 3 || themeId === "none") {
        if (themeId === "none") {
          setQ3Answers(["none"]);
        } else {
          setQ3Answers(prev => prev.filter(id => id !== "none").concat(themeId));
        }
      }
    } else {
      setQ3Answers(prev => prev.filter(id => id !== themeId));
    }
  };

  const handleQ4Change = (optionId: string, checked: boolean) => {
    if (checked) {
      setQ4Answers(prev => [...prev, optionId]);
    } else {
      setQ4Answers(prev => prev.filter(id => id !== optionId));
      if (optionId === "other") setQ4Other("");
    }
  };

  const handleQ5Change = (optionId: string, checked: boolean) => {
    if (checked) {
      setQ5Answers(prev => [...prev, optionId]);
    } else {
      setQ5Answers(prev => prev.filter(id => id !== optionId));
      if (optionId === "other") setQ5Other("");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!q1Rating) {
      toast({
        title: "Please answer all required questions",
        description: "Please rate how valuable the insights were.",
        variant: "destructive"
      });
      return;
    }
    if (!q2Answer) {
      toast({
        title: "Please answer all required questions",
        description: "Please indicate how likely you are to take action.",
        variant: "destructive"
      });
      return;
    }
    if (q3Answers.length === 0) {
      toast({
        title: "Please answer all required questions",
        description: "Please select at least one insight theme.",
        variant: "destructive"
      });
      return;
    }
    if (q4Answers.length === 0) {
      toast({
        title: "Please answer all required questions",
        description: "Please select what additional information would help.",
        variant: "destructive"
      });
      return;
    }
    if (showQ5 && q5Answers.length === 0) {
      toast({
        title: "Please answer all required questions",
        description: "Please let us know what's holding you back.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const q3ThemesText = q3Answers.map(id => themeOptions.find(opt => opt.id === id)?.label || id).join(", ");
    const q4MissingInfoText = q4Answers.map(id => {
      const option = missingInfoOptions.find(opt => opt.id === id);
      return id === "other" && q4Other ? `Other: ${q4Other}` : option?.label || id;
    }).join(", ");
    const q5BarriersText = showQ5 ? q5Answers.map(id => {
      const option = barrierOptions.find(opt => opt.id === id);
      return id === "other" && q5Other ? `Other: ${q5Other}` : option?.label || id;
    }).join(", ") : undefined;

    const surveyData: SurveyData = {
      timestamp: new Date().toISOString(),
      creator_id: creatorId,
      q1_value_rating: q1Rating,
      q2_actionability: q2Answer,
      q3_themes: q3ThemesText,
      q4_missing_info: q4MissingInfoText,
      q5_barriers: q5BarriersText,
      q6_open_feedback: q6Feedback || undefined,
    };

    try {
      const { error } = await supabase.functions.invoke('submit-survey', {
        body: surveyData
      });

      if (error) throw error;
      
      // Track survey submission
      trackSurveySubmit();
      
      onSubmit?.(surveyData);
      
      toast({
        title: "Feedback submitted!",
        description: "Thanks! Your feedback helps us improve your recommendations."
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Survey submission error:', error);
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
      <Card className="p-4 text-center bg-card border-border">
        <div className="py-6">
          <div className="text-3xl mb-3">🙏</div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">Thank you for your feedback!</h3>
          <p className="text-xs text-muted-foreground">Your input helps us improve your recommendations.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">Share Your Feedback</h3>
          <p className="text-xs text-muted-foreground">Help us improve your brand recommendations (5-6 questions)</p>
        </div>

        {/* Question 1: Value Rating */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            1. How valuable were these brand insights for your content strategy? *
          </Label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setQ1Rating(rating)}
                onMouseEnter={() => setQ1Hover(rating)}
                onMouseLeave={() => setQ1Hover(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                <Star
                  className={`w-6 h-6 ${
                    rating <= (q1Hover || q1Rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            {q1Rating > 0 && (
              <span className="ml-2 text-xs text-muted-foreground self-center">
                {q1Rating === 1 && "Not valuable"}
                {q1Rating === 2 && "Slightly valuable"}
                {q1Rating === 3 && "Moderately valuable"}
                {q1Rating === 4 && "Very valuable"}
                {q1Rating === 5 && "Extremely valuable"}
              </span>
            )}
          </div>
        </div>

        {/* Question 2: Actionability */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            2. How likely are you to take action on these recommendations? *
          </Label>
          <RadioGroup value={q2Answer} onValueChange={setQ2Answer}>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="Very Likely" id="q2-very-likely" />
              <Label htmlFor="q2-very-likely" className="text-xs">Very Likely</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="Likely" id="q2-likely" />
              <Label htmlFor="q2-likely" className="text-xs">Likely</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="Neutral" id="q2-neutral" />
              <Label htmlFor="q2-neutral" className="text-xs">Neutral</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="Unlikely" id="q2-unlikely" />
              <Label htmlFor="q2-unlikely" className="text-xs">Unlikely</Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="Very Unlikely" id="q2-very-unlikely" />
              <Label htmlFor="q2-very-unlikely" className="text-xs">Very Unlikely</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 3: Feature Preference */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            3. Which insight themes were most valuable? (Select up to 3) *
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {themeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-1.5">
                <Checkbox
                  id={`q3-${option.id}`}
                  checked={q3Answers.includes(option.id)}
                  disabled={!q3Answers.includes(option.id) && q3Answers.length >= 3 && option.id !== "none"}
                  onCheckedChange={(checked) => handleQ3Change(option.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`q3-${option.id}`} 
                  className="flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </div>
          {q3Answers.length > 0 && q3Answers.length < 3 && !q3Answers.includes("none") && (
            <p className="text-xs text-muted-foreground">
              You can select {3 - q3Answers.length} more
            </p>
          )}
        </div>

        {/* Question 4: Missing Information */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            4. What additional information would help you decide which brands to promote? *
          </Label>
          <div className="space-y-1.5">
            {missingInfoOptions.map((option) => (
              <div key={option.id}>
                <div className="flex items-center space-x-1.5">
                  <Checkbox
                    id={`q4-${option.id}`}
                    checked={q4Answers.includes(option.id)}
                    onCheckedChange={(checked) => handleQ4Change(option.id, checked as boolean)}
                  />
                  <Label htmlFor={`q4-${option.id}`} className="cursor-pointer text-xs">
                    {option.label}
                  </Label>
                </div>
                {option.id === "other" && q4Answers.includes("other") && (
                  <Textarea
                    placeholder="Please specify..."
                    value={q4Other}
                    onChange={(e) => setQ4Other(e.target.value)}
                    className="mt-2 ml-6 min-h-[70px] text-xs"
                    maxLength={200}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question 5: Barriers (Conditional) */}
        {showQ5 && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs font-medium">
              5. What's holding you back from creating content for these brands? *
            </Label>
            <div className="space-y-1.5">
              {barrierOptions.map((option) => (
                <div key={option.id}>
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`q5-${option.id}`}
                      checked={q5Answers.includes(option.id)}
                      onCheckedChange={(checked) => handleQ5Change(option.id, checked as boolean)}
                    />
                    <Label htmlFor={`q5-${option.id}`} className="cursor-pointer text-xs">
                      {option.label}
                    </Label>
                  </div>
                  {option.id === "other" && q5Answers.includes("other") && (
                    <Textarea
                      placeholder="Please specify..."
                      value={q5Other}
                      onChange={(e) => setQ5Other(e.target.value)}
                      className="mt-2 ml-6 min-h-[70px] text-xs"
                      maxLength={200}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question 6: Open Feedback */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {showQ5 ? "6" : "5"}. Any other feedback or suggestions? (Optional)
          </Label>
          <Textarea
            placeholder="Share any additional thoughts..."
            value={q6Feedback}
            onChange={(e) => setQ6Feedback(e.target.value)}
            className="min-h-[70px] text-xs"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {q6Feedback.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2 text-sm"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </Card>
  );
};

export default SurveySection;