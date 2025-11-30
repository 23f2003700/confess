"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Spline from "@splinetool/react-spline";
import { Application } from "@splinetool/runtime";
import { motion } from "framer-motion";
import Link from "next/link";

// Pre-generated particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 5, top: 10, duration: 3.2, delay: 0.1 },
  { left: 15, top: 25, duration: 4.1, delay: 0.5 },
  { left: 25, top: 80, duration: 3.8, delay: 1.2 },
  { left: 35, top: 45, duration: 4.5, delay: 0.3 },
  { left: 45, top: 15, duration: 3.5, delay: 1.8 },
  { left: 55, top: 70, duration: 4.2, delay: 0.7 },
  { left: 65, top: 35, duration: 3.9, delay: 1.5 },
  { left: 75, top: 90, duration: 4.0, delay: 0.9 },
  { left: 85, top: 55, duration: 3.6, delay: 1.1 },
  { left: 95, top: 20, duration: 4.3, delay: 0.4 },
  { left: 10, top: 60, duration: 3.7, delay: 1.6 },
  { left: 20, top: 5, duration: 4.4, delay: 0.2 },
  { left: 30, top: 75, duration: 3.3, delay: 1.0 },
  { left: 40, top: 30, duration: 4.6, delay: 0.6 },
  { left: 50, top: 85, duration: 3.4, delay: 1.4 },
  { left: 60, top: 50, duration: 4.1, delay: 0.8 },
  { left: 70, top: 12, duration: 3.9, delay: 1.7 },
  { left: 80, top: 65, duration: 4.2, delay: 0.0 },
  { left: 90, top: 40, duration: 3.5, delay: 1.3 },
  { left: 98, top: 95, duration: 4.0, delay: 0.5 },
];

export default function Home() {
  const splineRef = useRef<Application | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSplineLoad = useCallback((spline: Application) => {
    splineRef.current = spline;
    setIsLoading(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Normalize to -1 to 1 range
      const x = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((clientY - rect.top) / rect.height - 0.5) * 2;

      setMousePosition({ x, y });
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <motion.p 
              className="text-2xl text-white/90"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              😀 कैसे हो
            </motion.p>
          </motion.div>
        </div>
      )}

      {/* Spline 3D Scene with Parallax Effect */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          transform: `perspective(1000px) rotateY(${mousePosition.x * 5}deg) rotateX(${-mousePosition.y * 5}deg)`,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <Spline
          scene="/anime.spline"
          onLoad={handleSplineLoad}
          className="h-full w-full"
        />
      </motion.div>

      {/* Gradient Overlay for better text visibility */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Two Buttons Container - Fixed at bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 50 : 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col gap-4 sm:flex-row sm:gap-6 sm:bottom-12"
      >
        {/* View Confessions Button */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            href="/feed"
            className="group relative block overflow-hidden rounded-2xl border border-pink-400/30 bg-pink-500/10 px-6 py-3 
                       text-base font-medium text-white backdrop-blur-md transition-all duration-300
                       hover:border-pink-400/50 hover:bg-pink-500/20
                       sm:px-8 sm:py-4 sm:text-lg"
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-pink-600/30 via-rose-500/30 to-pink-600/30"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
              }}
            />

            {/* Button Text */}
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-xl">👀</span>
              <span className="font-semibold tracking-wide">देख लो</span>
            </span>
          </Link>
        </motion.div>

        {/* Write Confession Button */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            href="/confess"
            className="group relative block overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-6 py-3 
                       text-base font-medium text-white backdrop-blur-md transition-all duration-300
                       hover:border-purple-400/50 hover:bg-white/20
                       sm:px-8 sm:py-4 sm:text-lg"
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-purple-600/30"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
              }}
            />

            {/* Button Text */}
            <span className="relative z-10 flex items-center gap-2">
              <span className="font-light tracking-wider opacity-80">
                𝗌̷𝖺̷𝗒̷ ̷𝗂̷𝗍̷
              </span>
              <span className="font-semibold tracking-wide">write it</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ✍️
              </motion.span>
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Floating particles effect - only render on client */}
      {isMounted && (
        <div className="pointer-events-none absolute inset-0 z-5">
          {PARTICLE_POSITIONS.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-purple-400/30"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: particle.duration,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
