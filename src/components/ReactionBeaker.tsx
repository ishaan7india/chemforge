import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- CONFIGURATION ---
const ATOM_COUNT = 60;
const ATOM_RADIUS = 5;
const SPEED = 1.5;
const REACTION_DIST = ATOM_RADIUS * 2.5;

type AtomType = 'A' | 'B' | 'PRODUCT';

interface Atom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: AtomType;
  id: number;
}

interface ReactionBeakerProps {
  reactantAName?: string;
  reactantBName?: string;
}

export const ReactionBeaker = ({ reactantAName = "Reactant A", reactantBName = "Reactant B" }: ReactionBeakerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ a: 0, b: 0, product: 0 });
  
  const atomsRef = useRef<Atom[]>([]);
  const requestRef = useRef<number>();

  // --- INITIALIZE ATOMS ---
  const initSimulation = () => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const newAtoms: Atom[] = [];
    for (let i = 0; i < ATOM_COUNT; i++) {
      newAtoms.push({
        id: i,
        x: Math.random() * (width - 20) + 10,
        y: Math.random() * (height - 20) + 10,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        type: Math.random() > 0.5 ? 'A' : 'B', // 50/50 mix
      });
    }
    atomsRef.current = newAtoms;
    updateStats();
  };

  const updateStats = () => {
    const counts = atomsRef.current.reduce((acc, atom) => {
      if (atom.type === 'A') acc.a++;
      else if (atom.type === 'B') acc.b++;
      else acc.product++;
      return acc;
    }, { a: 0, b: 0, product: 0 });
    setStats(counts);
  };

  // --- ANIMATION LOOP ---
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear Canvas (Video effect)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Physics & Drawing
    atomsRef.current.forEach((atom, i) => {
      // Move
      atom.x += atom.vx;
      atom.y += atom.vy;

      // Wall Bounce
      if (atom.x <= ATOM_RADIUS || atom.x >= canvas.width - ATOM_RADIUS) atom.vx *= -1;
      if (atom.y <= ATOM_RADIUS || atom.y >= canvas.height - ATOM_RADIUS) atom.vy *= -1;

      // Keep inside bounds
      atom.x = Math.max(ATOM_RADIUS, Math.min(canvas.width - ATOM_RADIUS, atom.x));
      atom.y = Math.max(ATOM_RADIUS, Math.min(canvas.height - ATOM_RADIUS, atom.y));

      // Draw Atom
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = getColor(atom.type);
      ctx.shadowBlur = 8;
      ctx.shadowColor = getColor(atom.type);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();

      // Collision/Reaction Logic
      for (let j = i + 1; j < atomsRef.current.length; j++) {
        const other = atomsRef.current[j];
        const dx = atom.x - other.x;
        const dy = atom.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REACTION_DIST) {
          // Physics Bounce
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // Rotate velocity
          const vx1 = atom.vx * cos + atom.vy * sin;
          const vy1 = atom.vy * cos - atom.vx * sin;
          const vx2 = other.vx * cos + other.vy * sin;
          const vy2 = other.vy * cos - other.vx * sin;

          // Swap
          const vx1Final = vx2;
          const vx2Final = vx1;

          // Rotate back
          atom.vx = vx1Final * cos - vy1 * sin;
          atom.vy = vy1 * cos + vx1Final * sin;
          other.vx = vx2Final * cos - vy2 * sin;
          other.vy = vy2 * cos + vx2Final * sin;

          // Separate to prevent sticking
          const overlap = REACTION_DIST - dist;
          atom.x += (overlap / 2) * Math.cos(angle);
          atom.y += (overlap / 2) * Math.sin(angle);
          other.x -= (overlap / 2) * Math.cos(angle);
          other.y -= (overlap / 2) * Math.sin(angle);

          // CHEMICAL REACTION: A + B -> PRODUCT
          if ((atom.type === 'A' && other.type === 'B') || 
              (atom.type === 'B' && atom.type === 'A')) {
            atom.type = 'PRODUCT';
            other.type = 'PRODUCT';
          }
        }
      }
    });

    // Update stats occasionally to save performance
    if (Math.random() > 0.95) updateStats();

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const getColor = (type: AtomType) => {
    switch (type) {
      case 'A': return '#3b82f6'; // Blue
      case 'B': return '#ef4444'; // Red
      case 'PRODUCT': return '#a855f7'; // Purple
      default: return '#fff';
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    initSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* GLASS BEAKER CONTAINER */}
      <div className="relative w-full h-[320px] bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl group">
        
        {/* Canvas Layer */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
             <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        {/* Start Overlay */}
        {!isPlaying && stats.product === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10 transition-all">
                <Button onClick={() => setIsPlaying(true)} className="gap-2 shadow-xl hover:scale-105 transition-transform">
                    <Play className="w-4 h-4" /> Start Reaction
                </Button>
            </div>
        )}

        {/* Live HUD */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-xs font-mono space-y-1 z-20 shadow-lg">
            <div className="flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                {reactantAName || "Reactant A"}: {stats.a}
            </div>
            <div className="flex items-center gap-2 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> 
                {reactantBName || "Reactant B"}: {stats.b}
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-bold border-t border-white/10 pt-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div> 
                Product: {stats.product}
            </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-2 justify-center">
        <Button 
            variant={isPlaying ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-32"
        >
            {isPlaying ? <><Pause className="w-4 h-4 mr-2"/> Pause</> : <><Play className="w-4 h-4 mr-2"/> Resume</>}
        </Button>
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => { initSimulation(); setIsPlaying(false); }}
        >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
};
