import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- CONFIGURATION ---
const ATOM_COUNT = 60;
const ATOM_RADIUS = 5;
const SPEED = 2;
const REACTION_DIST = ATOM_RADIUS * 2.2; // Distance to trigger reaction

type AtomType = 'A' | 'B' | 'PRODUCT';

interface Atom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: AtomType;
  id: number;
}

export const ReactionBeaker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stats, setStats] = useState({ a: 0, b: 0, product: 0 });
  
  // Refs for animation loop to avoid re-renders
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

    // 1. Clear Canvas
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
      ctx.shadowBlur = 5;
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
          const speed1 = Math.sqrt(atom.vx * atom.vx + atom.vy * atom.vy);
          const speed2 = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
          atom.vx = -Math.cos(angle) * speed1;
          atom.vy = -Math.sin(angle) * speed1;
          other.vx = Math.cos(angle) * speed2;
          other.vy = Math.sin(angle) * speed2;

          // REACTION: If A hits B, they both become Product
          if ((atom.type === 'A' && other.type === 'B') || 
              (atom.type === 'B' && atom.type === 'A')) {
            atom.type = 'PRODUCT';
            other.type = 'PRODUCT';
            // Slight visual pop
            atom.vx *= 1.5; 
            other.vx *= 1.5;
          }
        }
      }
    });

    if (Math.random() > 0.9) updateStats(); // Update stats occasionally to save performance

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const getColor = (type: AtomType) => {
    switch (type) {
      case 'A': return '#3b82f6'; // Blue
      case 'B': return '#ef4444'; // Red
      case 'PRODUCT': return '#a855f7'; // Purple (Result)
      default: return '#fff';
    }
  };

  // --- EFFECTS ---
  
  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      initSimulation();
      // Restore atoms if resizing just to keep them on screen (optional logic omitted for brevity)
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial Load
  useEffect(() => {
    initSimulation();
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Play/Pause Toggle
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current!);
    }
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPlaying]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      
      {/* GLASS BEAKER CONTAINER */}
      <div className="relative group">
        <div 
            ref={containerRef}
            className="h-[400px] w-full bg-slate-900/40 backdrop-blur-md rounded-b-[3rem] border-x-2 border-b-4 border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] overflow-hidden relative"
        >
            {/* Liquid Surface */}
            <div className="absolute top-0 w-full h-[1px] bg-white/30 shadow-[0_0_10px_white]"></div>
            
            {/* The Canvas Layer */}
            <canvas ref={canvasRef} className="block w-full h-full" />
            
            {/* Glass Reflection Overlay */}
            <div className="absolute top-0 left-4 w-12 h-full bg-gradient-to-r from-white/5 to-transparent skew-x-6 pointer-events-none"></div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-between bg-card/50 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
        <div className="flex gap-2">
          <Button 
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => { initSimulation(); setIsPlaying(true); }}
            className="rounded-full hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Live Legend */}
        <div className="flex gap-3 text-xs font-mono">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> A: {stats.a}</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> B: {stats.b}</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div> AB: {stats.product}</div>
        </div>
      </div>
    </div>
  );
};
