import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Flame, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const Streak = () => {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchStreak(session.user.id);
      }
    });
  }, [navigate]);

  const fetchStreak = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_stats")
      .select("current_streak, last_activity_date")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setStreak(data.current_streak || 0);
      setLastActivity(data.last_activity_date);
    }
  };

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <Button
        id="btnTasksNav"
        variant="ghost"
        className="fixed top-6 left-6 z-50 glass-effect border border-primary/30 hover:neon-glow"
        onClick={() => navigate("/tasks")}
      >
        <ClipboardList className="w-5 h-5 mr-2" />
        Tasks
      </Button>
      <Navbar />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-4xl mx-auto pt-20 relative z-10">
        <h1 className="text-5xl font-bold text-center mb-12 text-glow">Quest Streak</h1>

        <Card className="p-12 glass-effect border-accent/30 neon-glow text-center">
          <div className="inline-block p-8 rounded-full bg-accent/20 mb-8 animate-float">
            <Flame className="w-24 h-24 text-accent" />
          </div>
          
          <div className="space-y-4">
            <p className="text-muted-foreground text-xl">Current Streak</p>
            <p className="text-8xl font-bold text-accent">{streak}</p>
            <p className="text-2xl text-muted-foreground">
              {streak === 0 ? "Start your journey today!" : streak === 1 ? "day" : "days"}
            </p>
          </div>

          {lastActivity && (
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Last activity: {new Date(lastActivity).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-12 text-muted-foreground">
            <p className="text-lg">Complete tasks daily to maintain your streak!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Streak;
