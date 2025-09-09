import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CallToAction = () => {
  return (
    <div className="text-center py-8">
      <p className="text-lg text-foreground mb-6 font-medium">
        Pick one brand and create something today—it compounds fast.
      </p>
      <Button 
        asChild
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 text-lg font-semibold"
      >
        <a 
          href="https://creators.wishlink.com/dashboard"
          className="inline-flex items-center gap-2"
        >
          Go to My Wishlink Dashboard
          <ArrowRight className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
};

export default CallToAction;