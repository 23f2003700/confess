"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LightRays from "@/components/LightRays";

interface Confession {
  id: string;
  message: string;
  createdAt: string;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function FeedPage() {
  // Start with empty array - only real confessions will appear here
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with AWS AppSync real-time subscription
  // This will connect to DynamoDB via AppSync for real-time updates
  const connectToRealTime = useCallback(() => {
    // Simulating connection establishment
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 1500);

    // TODO: AppSync subscription code will go here:
    // const subscription = API.graphql(graphqlOperation(onCreateConfession))
    //   .subscribe({
    //     next: (data) => {
    //       const newConfession = data.value.data.onCreateConfession;
    //       setConfessions(prev => [newConfession, ...prev]);
    //     }
    //   });
  }, []);

  useEffect(() => {
    connectToRealTime();

    // TODO: Fetch existing confessions from DynamoDB
    // const fetchConfessions = async () => {
    //   const result = await API.graphql(graphqlOperation(listConfessions));
    //   setConfessions(result.data.listConfessions.items);
    // };
    // fetchConfessions();
  }, [connectToRealTime]);

  // Update timestamps every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setConfessions((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      {/* LightRays Background */}
      <LightRays
        raysOrigin="top-center"
        raysColor="#a855f7"
        raysSpeed={1.2}
        lightSpread={0.9}
        rayLength={1.5}
        followMouse={true}
        mouseInfluence={0.15}
        noiseAmount={0.05}
        distortion={0.03}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <Link
              href="/"
              className="mb-2 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← back home
            </Link>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              देख लो <span className="text-purple-400">Confessions</span>
            </h1>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <motion.div
                  className="h-2 w-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="text-sm text-green-400">LIVE</span>
              </>
            ) : (
              <>
                <motion.div
                  className="h-2 w-2 rounded-full bg-yellow-500"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-sm text-yellow-400">connecting...</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex items-center justify-between rounded-xl border border-purple-500/20 bg-slate-900/50 px-4 py-3 backdrop-blur-sm"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-white">{confessions.length}</p>
            <p className="text-xs text-gray-400">confessions</p>
          </div>
          <div className="h-8 w-px bg-purple-500/30" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">👀</p>
            <p className="text-xs text-gray-400">watching</p>
          </div>
          <div className="h-8 w-px bg-purple-500/30" />
          <Link href="/confess">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors cursor-pointer">
                ✍️ Write
              </span>
            </motion.div>
          </Link>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4" />
            <p className="text-gray-400">Connecting to real-time feed...</p>
          </motion.div>
        )}

        {/* Empty State - No confessions yet */}
        {!isLoading && confessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="text-6xl mb-4">🤫</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              कोई confession नहीं है अभी
            </h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              Be the first one to share your feelings anonymously. Real confessions will appear here in real-time.
            </p>
            <Link href="/confess">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white shadow-lg shadow-purple-500/30 cursor-pointer">
                  ✍️ Write First Confession
                </span>
              </motion.div>
            </Link>

            {/* Real-time waiting animation */}
            <motion.div
              className="mt-10 flex items-center gap-2 text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="h-2 w-2 rounded-full bg-purple-500/50" />
              <span className="text-sm">Waiting for real-time confessions...</span>
            </motion.div>
          </motion.div>
        )}

        {/* Confessions Feed - WhatsApp Style */}
        {!isLoading && confessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {confessions.map((confession, index) => (
                <motion.div
                  key={confession.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="group"
                >
                  {/* New confession indicator for latest */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-2 text-center"
                    >
                      <span className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-400">
                        ✨ New confession
                      </span>
                    </motion.div>
                  )}

                  {/* Message Bubble - WhatsApp Style */}
                  <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm border border-purple-500/10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-4 shadow-lg backdrop-blur-sm">
                    {/* Message Content */}
                    <p className="text-gray-100 leading-relaxed text-[15px]">
                      {confession.message}
                    </p>

                    {/* Timestamp */}
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <span className="text-[11px] text-gray-500">
                        {getTimeAgo(confession.createdAt)}
                      </span>
                      <span className="text-[10px] text-purple-400">✓✓</span>
                    </div>

                    {/* Decorative tail */}
                    <div className="absolute -left-2 top-0 h-4 w-4 overflow-hidden">
                      <div className="absolute h-4 w-4 rotate-45 transform bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-l border-t border-purple-500/10" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Real-time indicator at bottom */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <motion.div
              className="inline-flex items-center gap-2 text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-green-500"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-sm">Real-time updates active</span>
            </motion.div>
          </motion.div>
        )}

        {/* Floating Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8"
        >
          <Link href="/confess">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow cursor-pointer"
            >
              ✍️
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
