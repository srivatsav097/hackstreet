import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Trophy, Zap, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const Rewards = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_bonus_points: 0, total_xp: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchStats(session.user.id);
      }
    });
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_stats")
      .select("total_bonus_points, total_xp")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setStats(data);
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-4xl mx-auto pt-20 relative z-10">
        <h1 className="text-5xl font-bold text-center mb-12 text-glow">Rewards Treasury</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 glass-effect border-primary/30 neon-glow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-primary/20 animate-float">
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Bonus Points</p>
                <p className="text-5xl font-bold text-primary">{stats.total_bonus_points}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 glass-effect border-secondary/30 neon-glow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-accent/20 animate-float" style={{ animationDelay: "0.5s" }}>
                <Zap className="w-12 h-12 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground">Total XP</p>
                <p className="text-5xl font-bold text-accent">{stats.total_xp}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl text-muted-foreground">Keep completing quests to earn more rewards!</p>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
