import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

interface SimulationHistory {
  id: string;
  reactant_a: string;
  reactant_b: string;
  quantity_a: number;
  unit_a: string;
  quantity_b: number;
  unit_b: string;
  limiting_reagent: string;
  products_formed: any;
  theoretical_yield: number;
  balanced_equation: string;
  reaction_type: string;
  observation: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<SimulationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("simulation_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast.error("Failed to load simulation history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("simulation_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Simulation deleted");
      fetchHistory();
    } catch (error: any) {
      toast.error("Failed to delete simulation");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Beaker className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Beaker className="w-8 h-8 text-primary animate-glow" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChemForge
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/simulator")}>
                <Plus className="w-4 h-4 mr-2" />
                New Simulation
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Simulations</h2>
          <p className="text-muted-foreground">View and manage your chemical reaction history</p>
        </div>

        {history.length === 0 ? (
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <Beaker className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-4">No simulations yet</p>
              <Button onClick={() => navigate("/simulator")}>
                <Plus className="w-4 h-4 mr-2" />
                Run Your First Simulation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {history.map((sim) => (
              <Card key={sim.id} className="backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{sim.balanced_equation}</CardTitle>
                      <CardDescription>
                        {new Date(sim.created_at).toLocaleDateString()} at{" "}
                        {new Date(sim.created_at).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSimulation(sim.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Reaction Type:</span>{" "}
                    <span className="text-sm text-muted-foreground">{sim.reaction_type}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Limiting Reagent:</span>{" "}
                    <span className="text-sm text-accent">{sim.limiting_reagent}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Theoretical Yield:</span>{" "}
                    <span className="text-sm text-muted-foreground">{sim.theoretical_yield.toFixed(2)}g</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Observation:</span>{" "}
                    <span className="text-sm text-muted-foreground">{sim.observation}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
