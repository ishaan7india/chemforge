import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Beaker, FlaskConical, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        navigate("/simulator");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate("/simulator");
    } else {
      navigate("/auth");
    }
  };

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
            <Button onClick={handleGetStarted}>
              {user ? "Go to Simulator" : "Sign In"}
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex justify-center">
              <Beaker className="w-24 h-24 text-primary animate-float" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-slow">
              Welcome to ChemForge
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Your digital chemistry laboratory. Simulate real chemical reactions with precision
              stoichiometry, identify limiting reagents, and visualize reaction progress in real-time.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                  Sign Up Free
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <FlaskConical className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">20+ Reactions</h3>
                <p className="text-muted-foreground">
                  Extensive database of common chemical reactions including neutralization,
                  precipitation, and gas evolution reactions.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Precise Calculations</h3>
                <p className="text-muted-foreground">
                  Automatic stoichiometry engine calculates limiting reagents, product yields,
                  and excess reactants with laboratory accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Beaker className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Visual Simulation</h3>
                <p className="text-muted-foreground">
                  Interactive progress bars and animated beaker show reaction progress in real-time
                  as you adjust the simulation slider.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Experimenting?</h2>
            <p className="text-muted-foreground mb-8">
              Join ChemForge today and transform the way you understand chemical reactions.
              Save your simulation history, track your experiments, and learn chemistry interactively.
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
              Launch Simulator
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Beaker className="w-6 h-6 text-primary" />
              <span className="font-semibold">ChemForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ChemForge. Your digital chemistry lab.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
