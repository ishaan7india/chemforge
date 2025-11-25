import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Beaker, Home, LogOut, Play, Save } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

interface Reaction {
  id: string;
  reactant_a: string;
  reactant_b: string;
  products: any;
  reaction_type: string;
  enthalpy_change: number;
  observation: string;
  balanced_equation: string;
}

interface SimulationResult {
  success: boolean;
  limitingReagent: string;
  excessReagent: string;
  excessMoles: number;
  productsFormed: Array<{
    name: string;
    moles: number;
    mass: number;
    coefficient: number;
  }>;
  theoreticalYield: number;
  balancedEquation: string;
  reactionType: string;
  observation: string;
  enthalpyChange: number;
  steps: string[];
}

const Simulator = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactantA, setReactantA] = useState("");
  const [reactantB, setReactantB] = useState("");
  const [quantityA, setQuantityA] = useState("");
  const [unitA, setUnitA] = useState("grams");
  const [quantityB, setQuantityB] = useState("");
  const [unitB, setUnitB] = useState("grams");
  const [progress, setProgress] = useState([0]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const uniqueReactants = Array.from(
    new Set(reactions.flatMap((r) => [r.reactant_a, r.reactant_b]))
  ).sort();

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
    fetchReactions();
  }, []);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase.from("reactions").select("*");
      if (error) throw error;
      setReactions(data || []);
    } catch (error: any) {
      toast.error("Failed to load reactions");
    }
  };

  const handleSimulate = async () => {
    if (!reactantA || !reactantB || !quantityA || !quantityB) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSimulating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("simulate-reaction", {
        body: {
          reactantA,
          reactantB,
          quantityA: parseFloat(quantityA),
          unitA,
          quantityB: parseFloat(quantityB),
          unitB,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success("Simulation complete!");
    } catch (error: any) {
      toast.error(error.message || "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.from("simulation_history").insert({
        user_id: user.id,
        reactant_a: reactantA,
        reactant_b: reactantB,
        quantity_a: parseFloat(quantityA),
        unit_a: unitA,
        quantity_b: parseFloat(quantityB),
        unit_b: unitB,
        limiting_reagent: result.limitingReagent,
        products_formed: result.productsFormed,
        theoretical_yield: result.theoreticalYield,
        balanced_equation: result.balancedEquation,
        reaction_type: result.reactionType,
        observation: result.observation,
      });

      if (error) throw error;
      toast.success("Simulation saved to history!");
    } catch (error: any) {
      toast.error("Failed to save simulation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const currentProgress = progress[0];
  const reactantARemaining = 100 - currentProgress;
  const reactantBRemaining = 100 - currentProgress;
  const productAFormed = currentProgress;

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
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
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
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Reaction Setup</CardTitle>
                <CardDescription>Select reactants and enter quantities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reactant-a">Reactant A</Label>
                  <Select value={reactantA} onValueChange={setReactantA}>
                    <SelectTrigger id="reactant-a" className="bg-input">
                      <SelectValue placeholder="Select reactant" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {uniqueReactants.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity-a">Quantity</Label>
                    <Input
                      id="quantity-a"
                      type="number"
                      step="0.01"
                      value={quantityA}
                      onChange={(e) => setQuantityA(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-a">Unit</Label>
                    <Select value={unitA} onValueChange={setUnitA}>
                      <SelectTrigger id="unit-a" className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="grams">Grams</SelectItem>
                        <SelectItem value="moles">Moles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reactant-b">Reactant B</Label>
                  <Select value={reactantB} onValueChange={setReactantB}>
                    <SelectTrigger id="reactant-b" className="bg-input">
                      <SelectValue placeholder="Select reactant" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {uniqueReactants.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity-b">Quantity</Label>
                    <Input
                      id="quantity-b"
                      type="number"
                      step="0.01"
                      value={quantityB}
                      onChange={(e) => setQuantityB(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-b">Unit</Label>
                    <Select value={unitB} onValueChange={setUnitB}>
                      <SelectTrigger id="unit-b" className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="grams">Grams</SelectItem>
                        <SelectItem value="moles">Moles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSimulate} className="w-full" disabled={isSimulating}>
                  <Play className="w-4 h-4 mr-2" />
                  {isSimulating ? "Simulating..." : "Simulate Reaction"}
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Simulation Results</CardTitle>
                  <CardDescription>Detailed stoichiometric analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20">
                    <h3 className="font-semibold text-lg mb-2">{result.balancedEquation}</h3>
                    <p className="text-sm text-muted-foreground">{result.reactionType}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Limiting Reagent</h4>
                    <p className="text-accent font-medium">{result.limitingReagent}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Products Formed</h4>
                    {result.productsFormed.map((product, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{product.name}:</span>{" "}
                        <span className="text-muted-foreground">
                          {product.mass.toFixed(2)}g ({product.moles.toFixed(4)} mol)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Theoretical Yield</h4>
                    <p className="text-accent font-medium">{result.theoreticalYield.toFixed(2)}g</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Excess Reagent</h4>
                    <p className="text-sm text-muted-foreground">
                      {result.excessReagent}: {result.excessMoles.toFixed(4)} mol remaining
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Observation</h4>
                    <p className="text-sm text-muted-foreground">{result.observation}</p>
                  </div>

                  {result.enthalpyChange && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Enthalpy Change</h4>
                      <p className="text-sm text-muted-foreground">
                        ΔH = {result.enthalpyChange} kJ/mol{" "}
                        {result.enthalpyChange < 0 ? "(Exothermic)" : "(Endothermic)"}
                      </p>
                    </div>
                  )}

                  <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save to History"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Visual Simulation</CardTitle>
                <CardDescription>Watch the reaction progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reaction Progress</span>
                    <span className="text-primary font-medium">{currentProgress}%</span>
                  </div>
                  <Slider
                    value={progress}
                    onValueChange={setProgress}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{reactantA || "Reactant A"}</span>
                      <span className="text-muted-foreground">{reactantARemaining}%</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${reactantARemaining}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{reactantB || "Reactant B"}</span>
                      <span className="text-muted-foreground">{reactantBRemaining}%</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${reactantBRemaining}%` }}
                      />
                    </div>
                  </div>

                  <div className="my-4 text-center text-2xl text-accent animate-pulse">→</div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Products</span>
                      <span className="text-accent">{productAFormed}%</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${productAFormed}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-b from-transparent to-primary/10">
                  <div className="relative h-48 flex items-end justify-center">
                    <div
                      className="w-32 bg-gradient-to-t from-primary/40 to-transparent rounded-t-full transition-all duration-300"
                      style={{ height: `${currentProgress}%` }}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-accent blur-sm animate-float" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">Reaction Beaker</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Simulator;
