import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import wishLinkLogo from "@/assets/wishlink-logo.png";

const Landing = () => {
  const [creatorUuid, setCreatorUuid] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creatorUuid.trim()) {
      return;
    }

    // Check if this is the master admin ID
    if (creatorUuid === "0000000000") {
      navigate("/admin");
    } else {
      navigate(`/insights?creator_id=${creatorUuid}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={wishLinkLogo} 
              alt="WishLink" 
              className="h-12 object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Creator Insights
            </CardTitle>
            <CardDescription className="text-base">
              Enter your Creator ID to view personalized brand insights
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="creatorId" className="text-sm font-medium">
                Creator ID
              </label>
              <Input
                id="creatorId"
                type="text"
                placeholder="Enter your Creator ID"
                value={creatorUuid}
                onChange={(e) => setCreatorUuid(e.target.value)}
                className="text-center text-lg tracking-wider"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!creatorUuid.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              View Insights
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Landing;
