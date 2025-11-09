import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface DailyProgress {
  date: string;
  bonus_points: number;
  xp: number;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const Progress = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProgress(session.user.id);
        fetchTasks(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProgress = async (userId: string) => {
    const startDate = format(subDays(new Date(), 6), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .order("date", { ascending: true });

    if (!error && data) {
      // Fill in missing days with zero values
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        const existing = data.find((d) => d.date === date);
        return existing || { date, bonus_points: 0, xp: 0 };
      });
      setProgress(last7Days);
    }
  };

  const fetchTasks = async (userId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIncompleteTasks(data.filter((task) => !task.completed));
      setCompletedTasks(data.filter((task) => task.completed));
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-6xl mx-auto pt-20 relative z-10">
        <h1 className="text-5xl font-bold text-center mb-12 text-glow">Quest Progress</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bonus Points Chart */}
          <Card className="p-6 glass-effect border-primary/30">
            <h2 className="text-2xl font-bold mb-6 text-primary">Daily Bonus Points</h2>
            <div className="space-y-4">
              {progress.map((day) => (
                <div key={`bp-${day.date}`} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(day.date), "MMM dd")}</span>
                    <span className="text-primary font-bold">{day.bonus_points} BP</span>
                  </div>
                  <div className="h-8 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                      style={{ width: `${Math.min((day.bonus_points / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* XP Chart */}
          <Card className="p-6 glass-effect border-accent/30">
            <h2 className="text-2xl font-bold mb-6 text-accent">Daily XP</h2>
            <div className="space-y-4">
              {progress.map((day) => (
                <div key={`xp-${day.date}`} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(day.date), "MMM dd")}</span>
                    <span className="text-accent font-bold">{day.xp} XP</span>
                  </div>
                  <div className="h-8 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500"
                      style={{ width: `${Math.min((day.xp / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quest Segregation */}
        <div className="mt-12 space-y-6">
          <Collapsible open={incompleteOpen} onOpenChange={setIncompleteOpen}>
            <Card className="glass-effect border-primary/30">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">Incomplete Quests</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {incompleteTasks.length}
                  </Badge>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${incompleteOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-3">
                  {incompleteTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No incomplete quests</p>
                  ) : (
                    incompleteTasks.map((task) => (
                      <div key={task.id} className="p-4 bg-background/50 rounded-lg border border-primary/20">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created: {format(new Date(task.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
            <Card className="glass-effect border-accent/30">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">Completed Quests</h3>
                  <Badge variant="secondary" className="bg-accent/20 text-accent">
                    {completedTasks.length}
                  </Badge>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${completedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-3">
                  {completedTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No completed quests yet</p>
                  ) : (
                    completedTasks.map((task) => (
                      <div key={task.id} className="p-4 bg-background/50 rounded-lg border border-accent/20">
                        <p className="font-medium line-through opacity-75">{task.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Completed: {task.completed_at ? format(new Date(task.completed_at), "MMM dd, yyyy") : "N/A"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default Progress;
