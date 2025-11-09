import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Sparkles, Home, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  bonus_points: number;
  xp: number;
}

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMomentumToast, setShowMomentumToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchTasks(session.user.id);
        checkStaleProgress(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTasks = async (userId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching tasks");
    } else {
      setTasks(data || []);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert([{ user_id: user.id, title: newTask, completed: false }])
      .select()
      .single();

    if (error) {
      toast.error("Error adding task");
    } else {
      setTasks([data, ...tasks]);
      setNewTask("");
      toast.success("Task added!");
    }
    setLoading(false);
  };

  const completeTask = async (task: Task) => {
    if (task.completed) return;

    const bonusPoints = 1;
    const xp = 10;

    const { error } = await supabase
      .from("tasks")
      .update({ 
        completed: true, 
        bonus_points: bonusPoints, 
        xp: xp,
        completed_at: new Date().toISOString()
      })
      .eq("id", task.id);

    if (error) {
      toast.error("Error completing task");
      return;
    }

    // Update user stats
    const { data: userStats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (userStats) {
      await supabase
        .from("user_stats")
        .update({
          total_bonus_points: userStats.total_bonus_points + bonusPoints,
          total_xp: userStats.total_xp + xp,
          last_activity_date: new Date().toISOString().split("T")[0],
        })
        .eq("user_id", user.id);
    }

    // Update daily progress
    const today = new Date().toISOString().split("T")[0];
    const { data: progressData } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (progressData) {
      await supabase
        .from("daily_progress")
        .update({
          bonus_points: progressData.bonus_points + bonusPoints,
          xp: progressData.xp + xp,
        })
        .eq("id", progressData.id);
    } else {
      await supabase
        .from("daily_progress")
        .insert([{
          user_id: user.id,
          date: today,
          bonus_points: bonusPoints,
          xp: xp,
        }]);
    }

    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, completed: true, bonus_points: bonusPoints, xp } : t)));
    
    // Show animated reward
    const element = document.getElementById(`task-${task.id}`);
    if (element) {
      element.classList.add("animate-pulse-glow");
      setTimeout(() => {
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>+{bonusPoints} Bonus Point • +{xp} XP</span>
          </div>,
          { duration: 3000 }
        );
      }, 200);
    }
  };

  const checkStaleProgress = async (userId: string) => {
    const { data } = await supabase
      .from("user_stats")
      .select("last_activity_date")
      .eq("user_id", userId)
      .single();

    if (data?.last_activity_date) {
      const lastActivity = new Date(data.last_activity_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      const lastToastKey = "lastMomentumToast";
      const lastToast = localStorage.getItem(lastToastKey);
      const shouldShowToast = !lastToast || 
        Math.floor((now.getTime() - new Date(lastToast).getTime()) / (1000 * 60 * 60 * 24)) >= 1;

      if (daysDiff >= 2 && shouldShowToast) {
        setShowMomentumToast(true);
        localStorage.setItem(lastToastKey, now.toISOString());
        setTimeout(() => {
          toast.info("Restart the momentum", {
            id: "toastMomentum",
            duration: 6000,
          });
          setShowMomentumToast(false);
        }, 500);
      }
    }
  };

  const clearAllTasks = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Error clearing tasks");
    } else {
      setTasks([]);
      toast.success("All tasks cleared! Your XP and Bonus Points remain intact.");
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast.error("Error deleting task");
    } else {
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    }
  };

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <Button
        id="btnHome"
        variant="ghost"
        className="fixed top-6 left-6 z-50 glass-effect border border-secondary/30 hover:neon-glow"
        onClick={() => navigate("/")}
      >
        <Home className="w-5 h-5 mr-2" />
        Home
      </Button>
      <Navbar />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto pt-20 relative z-10">
        <h1 className="text-5xl font-bold text-center mb-12 text-glow">Your Quest Board</h1>

        {/* Add Task */}
        <Card className="p-6 mb-8 glass-effect border-primary/30 neon-glow">
          <div className="flex gap-3">
            <Input
              placeholder="What's your next quest?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
              className="glass-effect border-primary/30"
            />
            <Button
              onClick={addTask}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-secondary neon-glow"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card
              key={task.id}
              id={`task-${task.id}`}
              className={`p-6 glass-effect border-primary/30 transition-all ${
                task.completed ? "opacity-60" : "hover:neon-glow"
              }`}
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => completeTask(task)}
                  disabled={task.completed}
                  className="border-primary data-[state=checked]:bg-primary"
                />
                <span className={`flex-1 text-lg ${task.completed ? "line-through" : ""}`}>
                  {task.title}
                </span>
                {task.completed && (
                  <div className="flex gap-3 text-sm">
                    <span className="text-accent">+{task.xp} XP</span>
                    <span className="text-primary">+{task.bonus_points} BP</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  className="hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xl">No quests yet. Start your journey!</p>
            </div>
          )}
        </div>

        {/* Clear All Button */}
        {tasks.length > 0 && (
          <div className="mt-8 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  id="btnClearAll"
                  variant="outline"
                  className="glass-effect border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-effect border-primary/30">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Tasks?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all current tasks. This won't deduct already-earned XP or Bonus Points. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="glass-effect">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllTasks}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
