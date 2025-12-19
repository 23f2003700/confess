"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Avatar configurations - representing diverse students
const AVATARS = [
  { color: "#f97316", eyes: "normal", accessory: null }, // orange
  { color: "#ef4444", eyes: "normal", accessory: null }, // red
  { color: "#ec4899", eyes: "side", accessory: null }, // pink
  { color: "#a855f7", eyes: "normal", accessory: null }, // purple
  { color: "#3b82f6", eyes: "side", accessory: null }, // blue
  { color: "#22c55e", eyes: "green", accessory: null }, // green
  { color: "#eab308", eyes: "normal", accessory: null }, // yellow
  { color: "#06b6d4", eyes: "normal", accessory: "glasses" }, // cyan
  { color: "#6366f1", eyes: "side", accessory: null }, // indigo
  { color: "#f59e0b", eyes: "normal", accessory: "cone" }, // amber (traffic cone hat)
  { color: "#64748b", eyes: "normal", accessory: "halo" }, // slate
  { color: "#dc2626", eyes: "normal", accessory: "mohawk" }, // red with mohawk
  { color: "#7c3aed", eyes: "side", accessory: null }, // violet
  { color: "#14b8a6", eyes: "normal", accessory: null }, // teal
  { color: "#d97706", eyes: "normal", accessory: null }, // brown
];

// Pre-calculated positions for avatars in a crowd formation
const AVATAR_POSITIONS = [
  // Back row (top) - smaller
  { x: 30, y: 8, scale: 0.7, z: 1 },
  { x: 45, y: 5, scale: 0.6, z: 0 },
  { x: 60, y: 8, scale: 0.7, z: 1 },
  { x: 75, y: 5, scale: 0.6, z: 0 },
  // Second row
  { x: 20, y: 18, scale: 0.8, z: 2 },
  { x: 35, y: 15, scale: 0.75, z: 2 },
  { x: 50, y: 18, scale: 0.8, z: 2 },
  { x: 65, y: 15, scale: 0.75, z: 2 },
  { x: 80, y: 18, scale: 0.8, z: 2 },
  // Third row
  { x: 15, y: 30, scale: 0.9, z: 3 },
  { x: 30, y: 28, scale: 0.85, z: 3 },
  { x: 45, y: 32, scale: 0.9, z: 3 },
  { x: 60, y: 28, scale: 0.85, z: 3 },
  { x: 75, y: 30, scale: 0.9, z: 3 },
  { x: 88, y: 28, scale: 0.8, z: 3 },
  // Front row (bottom) - larger
  { x: 10, y: 45, scale: 1, z: 4 },
  { x: 25, y: 42, scale: 0.95, z: 4 },
  { x: 40, y: 48, scale: 1.05, z: 5 },
  { x: 55, y: 45, scale: 1, z: 4 },
  { x: 70, y: 48, scale: 1.05, z: 5 },
  { x: 85, y: 42, scale: 0.95, z: 4 },
];

interface AvatarProps {
  color: string;
  eyes: string;
  accessory: string | null;
  index: number;
}

function Avatar({ color, eyes, accessory, index }: AvatarProps) {
  const pos = AVATAR_POSITIONS[index % AVATAR_POSITIONS.length];
  
  return (
    <motion.div
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `scale(${pos.scale})`,
        zIndex: pos.z,
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3 + (index % 3),
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2
        }}
        className="relative"
      >
        {/* Body */}
        <div 
          className="w-16 h-20 rounded-t-full bg-slate-900"
          style={{ 
            boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.3)"
          }}
        />
        
        {/* Head */}
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full"
          style={{ 
            backgroundColor: color,
            boxShadow: `inset -5px -5px 15px rgba(0,0,0,0.3), inset 5px 5px 15px rgba(255,255,255,0.1)`
          }}
        >
          {/* Eyes */}
          <div className="absolute top-5 left-2 flex gap-2">
            <motion.div 
              className="w-3 h-3 bg-white rounded-full relative overflow-hidden"
              animate={eyes === "side" ? { x: [0, 2, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div 
                className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full top-0.5"
                style={{ left: eyes === "side" ? "50%" : "30%" }}
                animate={eyes === "normal" ? { y: [0, 1, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <motion.div 
              className="w-3 h-3 bg-white rounded-full relative overflow-hidden"
              animate={eyes === "side" ? { x: [0, 2, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div 
                className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full top-0.5"
                style={{ left: eyes === "side" ? "50%" : "30%" }}
                animate={eyes === "normal" ? { y: [0, 1, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
              />
            </motion.div>
          </div>
          
          {/* Eyebrows */}
          <div className="absolute top-3 left-2.5 w-2 h-0.5 bg-slate-800 rounded-full transform -rotate-6" />
          <div className="absolute top-3 left-7 w-2 h-0.5 bg-slate-800 rounded-full transform rotate-6" />
          
          {/* Green eyes special */}
          {eyes === "green" && (
            <>
              <div className="absolute top-5 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }}>
                <div className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full top-0.5 left-0.5" />
              </div>
              <div className="absolute top-5 left-7 w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }}>
                <div className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full top-0.5 left-0.5" />
              </div>
            </>
          )}
          
          {/* Accessories */}
          {accessory === "glasses" && (
            <div className="absolute top-4 left-0.5 flex items-center">
              <div className="w-4 h-4 border-2 border-slate-700 rounded-full bg-transparent" />
              <div className="w-2 h-0.5 bg-slate-700" />
              <div className="w-4 h-4 border-2 border-slate-700 rounded-full bg-transparent" />
            </div>
          )}
          
          {accessory === "cone" && (
            <div 
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "25px solid #f97316",
              }}
            >
              <div className="absolute -bottom-7 -left-2.5 w-5 h-2 bg-white rounded-sm" />
              <div className="absolute -bottom-5 -left-2 w-4 h-1.5 bg-white rounded-sm" />
            </div>
          )}
          
          {accessory === "halo" && (
            <motion.div 
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full border-4 border-blue-300/50"
              style={{ 
                boxShadow: "0 0 15px rgba(147, 197, 253, 0.8)",
                background: "linear-gradient(180deg, rgba(147, 197, 253, 0.3) 0%, transparent 100%)"
              }}
              animate={{ 
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {accessory === "mohawk" && (
            <div 
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-6 rounded-t-full"
              style={{ backgroundColor: "#ec4899" }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FloatingAvatars() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  // Component always renders since it's dynamically imported with ssr: false

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)
          `
        }}
      />
      
      {/* Stars / particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Avatar crowd with parallax effect */}
      <motion.div 
        className="absolute inset-0"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          transition: "transform 0.3s ease-out"
        }}
      >
        <div className="absolute bottom-[15%] left-0 right-0 h-[60%]">
          {AVATARS.map((avatar, i) => (
            <Avatar 
              key={i}
              color={avatar.color}
              eyes={avatar.eyes}
              accessory={avatar.accessory}
              index={i}
            />
          ))}
        </div>
      </motion.div>

      {/* Vignette overlay */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)"
        }}
      />
    </div>
  );
}
