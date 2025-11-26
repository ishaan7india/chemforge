import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Beaker, FlaskConical, Sparkles, TrendingUp, Atom } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { ParticleBackground } from "@/components/ParticleBackground";

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
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      
      {/* Floating atoms decoration */}
      <div className="fixed top-20 left-10 opacity-20 animate-float">
        <Atom className="w-32 h-32 text-primary animate-spin-slow" />
      </div>
      <div className="fixed bottom-20 right-10 opacity-20 animate-float" style={{ animationDelay: "2s" }}>
        <Atom className="w-24 h-24 text-accent animate-spin-slow" />
      </div>
      
      <nav className="border-b border-border/50 backdrop-blur-md bg-card/40 relative z-10 shadow-lg shadow-primary/5">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex justify-center perspective-1000 animate-slide-down">
              <div className="relative">
                <Beaker className="w-32 h-32 text-primary animate-float" />
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse-slow" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] animate-slide-up">
              Welcome to ChemForge
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-scale" style={{ animationDelay: "0.2s" }}>
              Your digital chemistry laboratory. Simulate real chemical reactions with precision
              stoichiometry, identify limiting reagents, and visualize reaction progress in real-time.
            </p>
            <div className="flex gap-4 justify-center animate-fade-in-scale" style={{ animationDelay: "0.4s" }}>
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="text-lg px-8 relative overflow-hidden group hover:scale-105 transition-transform shadow-lg shadow-primary/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <span className="relative flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 animate-bounce-subtle" />
                  Get Started
                </span>
              </Button>
              {!user && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/auth")} 
                  className="text-lg px-8 border-primary/30 hover:border-primary hover:scale-105 transition-all"
                >
                  Sign Up Free
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8 perspective-1000">
            <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 preserve-3d group animate-fade-in-scale shadow-xl hover:shadow-primary/20" style={{ animationDelay: "0.1s" }}>
              <CardContent className="pt-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-primary/20 animate-pulse-slow" />
                  <FlaskConical className="w-10 h-10 text-primary relative z-10 animate-wiggle" />
                </div>
                <h3 className="text-xl font-semibold mb-2 relative z-10">20+ Reactions</h3>
                <p className="text-muted-foreground relative z-10">
                  Extensive database of common chemical reactions including neutralization,
                  precipitation, and gas evolution reactions.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 preserve-3d group animate-fade-in-scale shadow-xl hover:shadow-accent/20" style={{ animationDelay: "0.2s" }}>
              <CardContent className="pt-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-accent/20 animate-pulse-slow" />
                  <TrendingUp className="w-10 h-10 text-accent relative z-10 animate-bounce-subtle" />
                </div>
                <h3 className="text-xl font-semibold mb-2 relative z-10">Precise Calculations</h3>
                <p className="text-muted-foreground relative z-10">
                  Automatic stoichiometry engine calculates limiting reagents, product yields,
                  and excess reactants with laboratory accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:-translate-y-2 preserve-3d group animate-fade-in-scale shadow-xl hover:shadow-primary/20" style={{ animationDelay: "0.3s" }}>
              <CardContent className="pt-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-primary/20 animate-pulse-slow" />
                  <Beaker className="w-10 h-10 text-primary relative z-10 animate-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-2 relative z-10">Visual Simulation</h3>
                <p className="text-muted-foreground relative z-10">
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
