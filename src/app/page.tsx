"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the FloatingAvatars component to avoid SSR issues
const FloatingAvatars = dynamic(() => import("@/components/FloatingAvatars"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
  ),
});

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      {/* Animated Avatar Background */}
      <FloatingAvatars />

      {/* Gradient Overlay for better text visibility */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Three Buttons Container - Fixed at bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col gap-4 sm:flex-row sm:gap-5 sm:bottom-12"
      >
        {/* Placements Prediction Button - NEW */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(34, 197, 94, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/placements"
            className="group relative block overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 
                       text-base font-medium text-white backdrop-blur-md transition-all duration-300
                       hover:border-emerald-400/50 hover:bg-emerald-500/20
                       sm:px-7 sm:py-4 sm:text-lg"
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-600/30 via-green-500/30 to-emerald-600/30"
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
              <span className="font-bold tracking-wide">होगा क्या</span>
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ¯\_(ツ)_/¯
              </motion.span>
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
            className="group relative block overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-3 
                       text-base font-medium text-white backdrop-blur-md transition-all duration-300
                       hover:border-purple-400/50 hover:bg-white/20
                       sm:px-7 sm:py-4 sm:text-lg"
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

        {/* View Confessions Button */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/feed"
            className="group relative block overflow-hidden rounded-2xl border border-pink-400/30 bg-pink-500/10 px-5 py-3 
                       text-base font-medium text-white backdrop-blur-md transition-all duration-300
                       hover:border-pink-400/50 hover:bg-pink-500/20
                       sm:px-7 sm:py-4 sm:text-lg"
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
      </motion.div>

      {/* Floating particles effect - only render on client */}
      {isMounted && (
        <div className="pointer-events-none absolute inset-0 z-5">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-purple-400/30"
              style={{
                left: `${(i * 23) % 100}%`,
                top: `${(i * 37) % 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 3),
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
