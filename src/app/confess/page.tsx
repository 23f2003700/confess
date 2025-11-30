"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import awsConfig from "@/aws-config";
import { createConfession } from "@/graphql/operations";

// Configure Amplify
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: awsConfig.aws_appsync_graphqlEndpoint,
      region: awsConfig.aws_appsync_region,
      defaultAuthMode: 'apiKey',
      apiKey: awsConfig.aws_appsync_apiKey,
    }
  }
});

const client = generateClient();

// Profanity filter - Hindi & English bad words
const BAD_WORDS = [
  // English
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'dick', 'cock', 'pussy', 'whore', 
  'slut', 'cunt', 'damn', 'crap', 'wtf', 'stfu', 'asshole', 'motherfucker',
  // Hindi transliterated
  'bhenchod', 'bhosdike', 'madarchod', 'chutiya', 'gaand', 'lauda', 'lund', 
  'bhadwa', 'randi', 'harami', 'kamina', 'bc', 'mc', 'bsdk',
  // Hindi script
  'चूतिया', 'भोसडी', 'मादरचोद', 'गांड', 'लौड़ा', 'रंडी', 'हरामी', 'बहनचोद'
];

function containsBadWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

export default function ConfessPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    // Client-side profanity check first
    if (containsBadWords(message)) {
      setNotification({ type: "error", text: "अच्छा लिखो 🙏 No bad words please!" });
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    try {
      // Send to AppSync backend
      await client.graphql({
        query: createConfession,
        variables: { message: message.trim() }
      });

      setMessage("");
      setNotification({ type: "success", text: "Your confession has been shared! 💜" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: unknown) {
      console.error('Error creating confession:', error);
      
      // Check if it's a profanity error from backend
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('PROFANITY') || errorMessage.includes('अच्छा')) {
        setNotification({ type: "error", text: "अच्छा लिखो 🙏 No bad words please!" });
      } else {
        setNotification({ type: "error", text: "Something went wrong. Try again!" });
      }
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      {/* LightRays Background */}
      <LightRays
        raysOrigin="top-center"
        raysColor="#00ffff"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
      />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← back home
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            ✍️ <span className="text-cyan-400">Write</span> Your Heart Out
          </h1>
          <p className="mt-2 text-gray-400">
            Anonymous • Pure • No judgement
          </p>
        </motion.div>

        {/* Confession Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
              {/* Glow effect */}
              <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="अपने दिल की बात लिखो... 💭"
                maxLength={500}
                rows={6}
                className="w-full resize-none rounded-2xl border-0 bg-slate-800/50 
                           p-4 text-white text-lg placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-cyan-400/30
                           transition-all duration-300"
              />
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {message.length}/500
                </span>
                <motion.button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3 
                             font-semibold text-white shadow-lg shadow-cyan-500/25
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:from-cyan-400 hover:to-purple-500 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    "Confess 💜"
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Quick Link to View Confessions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Link href="/feed">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-6 py-3 text-pink-300 backdrop-blur-sm hover:bg-pink-500/20 transition-all"
            >
              <span>👀</span>
              <span>देख लो - View All Confessions</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className={`fixed top-6 left-1/2 z-50 rounded-2xl px-6 py-4 text-white backdrop-blur-md shadow-xl ${
                notification.type === "error" 
                  ? "bg-red-500/90 border border-red-400/50" 
                  : "bg-green-500/90 border border-green-400/50"
              }`}
            >
              <span className="text-lg font-medium">{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
