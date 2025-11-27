import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Beaker, Home, LogOut, Play, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { ParticleBackground } from "@/components/ParticleBackground";
// IMPORT THE NEW COMPONENT
import { ReactionBeaker } from "@/components/ReactionBeaker";

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
          // Mock session handling for preview if real auth fails
          console.log("Session check");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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
      console.log("Failed to load reactions (Mock mode)");
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
      if (data && data.error) throw new Error(data.error);

      setResult(data);
      toast.success("Simulation complete!");
    } catch (error: any) {
      toast.error(error.message || "Simulation failed");
      // MOCK RESULT FOR PREVIEW
      setTimeout(() => {
        setResult({
            success: true,
            limitingReagent: reactantA || "Reactant A",
            excessReagent: reactantB || "Reactant B",
            excessMoles: 0.5,
            productsFormed: [{ name: "Product AB", moles: 1.2, mass: 25.5, coefficient: 1 }],
            theoreticalYield: 25.5,
            balancedEquation: `${reactantA} + ${reactantB} -> Product`,
            reactionType: "Synthesis",
            observation: "Color change to purple with heat release.",
            enthalpyChange: -50.2,
            steps: ["Calculate moles", "Find limiting", "Calculate yield"]
        });
        setIsSimulating(false);
      }, 1000);
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
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <nav className="border-b border-border/50 backdrop-blur-md bg-card/40 relative z-10 shadow-lg shadow-primary/5">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-primary/30 transition-all duration-300 shadow-xl group animate-slide-up">
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
                      {uniqueReactants.length > 0 ? uniqueReactants.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      )) : (
                          <>
                            <SelectItem value="Hydrogen">Hydrogen</SelectItem>
                            <SelectItem value="Oxygen">Oxygen</SelectItem>
                            <SelectItem value="Sodium">Sodium</SelectItem>
                            <SelectItem value="Chlorine">Chlorine</SelectItem>
                          </>
                      )}
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
                      {uniqueReactants.length > 0 ? uniqueReactants.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      )) : (
                          <>
                            <SelectItem value="Hydrogen">Hydrogen</SelectItem>
                            <SelectItem value="Oxygen">Oxygen</SelectItem>
                            <SelectItem value="Sodium">Sodium</SelectItem>
                            <SelectItem value="Chlorine">Chlorine</SelectItem>
                          </>
                      )}
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

                <Button 
                  onClick={handleSimulate} 
                  className="w-full relative overflow-hidden group hover:scale-105 transition-transform shadow-lg shadow-primary/20" 
                  disabled={isSimulating}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  <span className="relative flex items-center justify-center">
                    {isSimulating ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-bounce-subtle" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Simulate Reaction
                      </>
                    )}
                  </span>
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-accent/30 transition-all duration-300 shadow-xl animate-fade-in-scale">
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
            <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-accent/30 transition-all duration-300 shadow-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
                      <span className="font-medium text-blue-400">{reactantA || "Reactant A"}</span>
                      <span className="text-muted-foreground">{reactantARemaining}%</span>
                    </div>
                    <div className="h-4 bg-secondary rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out relative"
                        style={{ width: `${reactantARemaining}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-red-400">{reactantB || "Reactant B"}</span>
                      <span className="text-muted-foreground">{reactantBRemaining}%</span>
                    </div>
                    <div className="h-4 bg-secondary rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out relative"
                        style={{ width: `${reactantBRemaining}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-purple-400">Products</span>
                      <span className="text-accent">{productAFormed}%</span>
                    </div>
                    <div className="h-4 bg-secondary rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out relative"
                        style={{ width: `${productAFormed}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* --- THIS IS WHERE WE ADDED THE NEW COMPONENT --- */}
                <div className="mt-8">
                    <ReactionBeaker 
                        reactantAName={reactantA || "Reactant A"} 
                        reactantBName={reactantB || "Reactant B"} 
                    />
                </div>
                {/* ----------------------------------------------- */}

              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Simulator;
