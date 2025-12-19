"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import Image from "next/image";

// No AWS credentials here - all handled server-side

interface Confession {
  id: string;
  message: string;
  imageUrl?: string | null;
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

// Download image function
async function downloadImage(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

// Image component with loading state and error handling
function ConfessionImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (retryCount < 2) {
      // Retry loading after a short delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-48 bg-slate-800/50 rounded-xl flex items-center justify-center text-gray-500">
        <span>📷 Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/50 rounded-xl flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}
      <Image
        key={retryCount} // Force re-render on retry
        src={src}
        alt={alt}
        width={400}
        height={300}
        className={`w-full h-auto max-h-80 object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        unoptimized
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

export default function FeedPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch confessions from secure API route
  const fetchConfessions = useCallback(async () => {
    try {
      const response = await fetch('/api/confessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      const items = data.items || [];
      
      // Sort by createdAt descending (newest first)
      const sorted = items.sort((a: Confession, b: Confession) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setConfessions(sorted);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching confessions:', err);
      setError('Failed to load confessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling for updates
  useEffect(() => {
    fetchConfessions();
    
    // Poll for updates every 5 seconds (since we can't use WebSocket subscriptions through API route)
    const interval = setInterval(fetchConfessions, 5000);
    return () => clearInterval(interval);
  }, [fetchConfessions]);

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

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-center"
          >
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchConfessions}
              className="mt-2 text-sm text-red-300 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

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
        {!isLoading && confessions.length === 0 && !error && (
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
                    {/* Image Content */}
                    {confession.imageUrl && (
                      <div className="mb-3 relative group/image">
                        <div className="rounded-xl overflow-hidden border border-purple-500/20">
                          <ConfessionImage
                            src={confession.imageUrl}
                            alt="Confession image"
                          />
                        </div>
                        {/* Download Button */}
                        <motion.button
                          onClick={() => downloadImage(confession.imageUrl!, `confession-${confession.id}.jpg`)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm 
                                     text-white flex items-center justify-center shadow-lg
                                     opacity-0 group-hover/image:opacity-100 transition-opacity duration-200
                                     hover:bg-purple-600/80 border border-white/20"
                          title="Download image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </motion.button>
                        {/* Mobile-visible download button */}
                        <motion.button
                          onClick={() => downloadImage(confession.imageUrl!, `confession-${confession.id}.jpg`)}
                          whileTap={{ scale: 0.9 }}
                          className="sm:hidden absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm 
                                     text-white flex items-center justify-center shadow-lg
                                     hover:bg-purple-600/80 border border-white/20"
                          title="Download image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </motion.button>
                      </div>
                    )}

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
