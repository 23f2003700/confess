"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Parameter categories with their positions
const PARAMETERS = {
  top: [
    { id: "fame", label: "FAME", emoji: "🌟", hindiLabel: "शोहरत" },
    { id: "power", label: "POWER", emoji: "⚡", hindiLabel: "शक्ति" },
    { id: "wealth", label: "WEALTH", emoji: "💰", hindiLabel: "दौलत" },
  ],
  left: [
    { id: "care", label: "CARE", emoji: "💝", hindiLabel: "परवाह" },
    { id: "love", label: "LOVE", emoji: "❤️", hindiLabel: "प्यार" },
  ],
  right: [
    { id: "joy", label: "JOY", emoji: "😄", hindiLabel: "खुशी" },
    { id: "instinct", label: "INSTINCT", emoji: "🎯", hindiLabel: "सहज ज्ञान" },
  ],
  bottom: [
    { id: "peace", label: "PEACE", emoji: "☮️", hindiLabel: "शांति" },
    { id: "health", label: "HEALTH", emoji: "💪", hindiLabel: "सेहत" },
    { id: "meaning", label: "MEANING", emoji: "🔮", hindiLabel: "मतलब" },
  ],
  center: [
    { id: "doubt", label: "DOUBT", emoji: "🤔", hindiLabel: "शक" },
    { id: "confidence", label: "CONFIDENCE", emoji: "😎", hindiLabel: "विश्वास" },
    { id: "dam", label: "दम", emoji: "💨", hindiLabel: "दम" },
    { id: "sanak", label: "सनक", emoji: "🤪", hindiLabel: "सनक" },
    { id: "keeda", label: "कीड़ा", emoji: "🐛", hindiLabel: "कीड़ा" },
  ],
};

// Positive prediction messages
const POSITIVE_PREDICTIONS = [
  { text: "तू फाड़ देगा आज! 🔥", english: "You're gonna crush it today!" },
  { text: "तेरा तो होके रहेगा बेटा जी! 💪", english: "It's definitely happening for you!" },
  { text: "हो के रहेगा आज तो, जय हो! 🙌", english: "Today's your day, victory awaits!" },
  { text: "भाई तू legend है! 🏆", english: "Bro, you're a legend!" },
  { text: "Selection पक्का, doubt मत कर! ✅", english: "Selection confirmed, don't doubt!" },
  { text: "Universe तेरे साथ है! 🌌", english: "The universe is with you!" },
  { text: "तेरी energy different है! ⚡", english: "Your energy is different!" },
  { text: "आज तो magic होगा! ✨", english: "Magic is happening today!" },
  { text: "हीरा है तू हीरा! 💎", english: "You're a diamond!" },
  { text: "जीत तो तेरी है बस! 🥇", english: "Victory is already yours!" },
  { text: "तूफ़ान आने वाला है! 🌪️", english: "A storm is coming (in a good way)!" },
  { text: "बॉस बनने वाला है तू! 👑", english: "You're about to become the boss!" },
  { text: "Stars aligned हैं तेरे लिए! ⭐", english: "Stars are aligned for you!" },
  { text: "Champion material है तू! 🎖️", english: "You're champion material!" },
  { text: "किस्मत तेरा साथ दे रही है! 🍀", english: "Fortune favors you!" },
];

const NEUTRAL_PREDICTIONS = [
  { text: "देख लेते हैं, hope रख! 🤞", english: "Let's see, keep hope!" },
  { text: "Effort डाला है, result आएगा! 📈", english: "You've put in effort, results will come!" },
  { text: "Patience रख, सब होगा! ⏰", english: "Be patient, everything will happen!" },
  { text: "Journey का हिस्सा है! 🛤️", english: "It's part of the journey!" },
];

interface ParameterButtonProps {
  param: { id: string; label: string; emoji: string; hindiLabel: string };
  isSelected: boolean;
  onClick: () => void;
  delay: number;
}

function ParameterButton({ param, isSelected, onClick, delay }: ParameterButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.1, rotate: [-2, 2, -2, 0] }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300
        ${isSelected 
          ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/50 border-2 border-emerald-300" 
          : "bg-slate-800/80 text-white/80 border border-white/20 hover:border-white/40 hover:bg-slate-700/80"
        }
      `}
    >
      <span className="mr-1">{param.emoji}</span>
      <span className="hidden sm:inline">{param.label}</span>
      <span className="sm:hidden">{param.hindiLabel}</span>
      
      {isSelected && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <span className="text-xs">✓</span>
        </motion.div>
      )}
    </motion.button>
  );
}

export default function PlacementsPage() {
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
  const [prediction, setPrediction] = useState<{ text: string; english: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);

  // Calculate energy level based on positive vs negative selections
  useEffect(() => {
    const positiveParams = ["fame", "power", "wealth", "care", "love", "joy", "instinct", "peace", "health", "meaning", "confidence", "dam", "sanak", "keeda"];
    const negativeParams = ["doubt"];
    
    let energy = 0;
    selectedParams.forEach(param => {
      if (positiveParams.includes(param)) energy += 10;
      if (negativeParams.includes(param)) energy -= 5;
    });
    
    setEnergyLevel(Math.min(100, Math.max(0, energy)));
  }, [selectedParams]);

  const toggleParam = useCallback((id: string) => {
    setSelectedParams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    // Reset prediction when selection changes
    setShowResult(false);
    setPrediction(null);
    setSubmitted(false);
  }, []);

  const generatePrediction = useCallback(() => {
    if (selectedParams.size === 0) return;
    
    setIsGenerating(true);
    setShowResult(false);
    
    // Simulate thinking time
    setTimeout(() => {
      // Calculate positivity score
      const hasConfidence = selectedParams.has("confidence");
      const hasDam = selectedParams.has("dam");
      const hasSanak = selectedParams.has("sanak");
      const hasKeeda = selectedParams.has("keeda");
      const hasDoubt = selectedParams.has("doubt");
      const hasLove = selectedParams.has("love");
      const hasJoy = selectedParams.has("joy");
      
      let positivityScore = selectedParams.size * 10;
      if (hasConfidence) positivityScore += 20;
      if (hasDam) positivityScore += 15;
      if (hasSanak) positivityScore += 10;
      if (hasKeeda) positivityScore += 10;
      if (hasLove) positivityScore += 15;
      if (hasJoy) positivityScore += 15;
      if (hasDoubt && !hasConfidence) positivityScore -= 10;
      
      // Select prediction based on score
      let predictions: typeof POSITIVE_PREDICTIONS;
      if (positivityScore >= 50) {
        predictions = POSITIVE_PREDICTIONS;
      } else {
        predictions = NEUTRAL_PREDICTIONS;
      }
      
      const randomIndex = Math.floor(Math.random() * predictions.length);
      setPrediction(predictions[randomIndex]);
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  }, [selectedParams]);

  const submitToFeed = useCallback(async () => {
    if (!prediction) return;
    
    setIsSubmitting(true);
    
    try {
      const selectedLabels = Array.from(selectedParams).map(id => {
        for (const category of Object.values(PARAMETERS)) {
          const found = category.find(p => p.id === id);
          if (found) return found.emoji + found.label;
        }
        return id;
      }).join(", ");
      
      const message = `🎯 Placement Prediction:\n"${prediction.text}"\n\nSelected vibes: ${selectedLabels}\n\n#HogaKya #Placements`;
      
      const response = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [prediction, selectedParams]);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
              linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)
            `
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/40 rounded-full"
            style={{
              left: `${(i * 29) % 100}%`,
              top: `${(i * 17) % 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <Link
            href="/"
            className="mb-2 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            ← back home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            होगा क्या <span className="text-emerald-400">¯\_(ツ)_/¯</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Select your vibes, get your placement prediction! 🎯
          </p>
        </motion.div>

        {/* Energy Meter */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8 max-w-md mx-auto"
        >
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Energy Level</span>
            <span>{energyLevel}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: energyLevel > 70 
                  ? "linear-gradient(90deg, #22c55e, #10b981)" 
                  : energyLevel > 40 
                    ? "linear-gradient(90deg, #eab308, #f59e0b)"
                    : "linear-gradient(90deg, #ef4444, #f97316)"
              }}
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Parameters Grid */}
        <div className="relative mb-8">
          {/* Top Parameters */}
          <div className="flex justify-center gap-3 mb-6">
            {PARAMETERS.top.map((param, i) => (
              <ParameterButton
                key={param.id}
                param={param}
                isSelected={selectedParams.has(param.id)}
                onClick={() => toggleParam(param.id)}
                delay={i * 0.1}
              />
            ))}
          </div>

          {/* Middle Row - Left, Center, Right */}
          <div className="flex justify-between items-center gap-4 mb-6">
            {/* Left Parameters */}
            <div className="flex flex-col gap-2">
              {PARAMETERS.left.map((param, i) => (
                <ParameterButton
                  key={param.id}
                  param={param}
                  isSelected={selectedParams.has(param.id)}
                  onClick={() => toggleParam(param.id)}
                  delay={0.3 + i * 0.1}
                />
              ))}
            </div>

            {/* Center Parameters */}
            <div className="flex flex-wrap justify-center gap-2 max-w-[200px] sm:max-w-[250px]">
              {PARAMETERS.center.map((param, i) => (
                <ParameterButton
                  key={param.id}
                  param={param}
                  isSelected={selectedParams.has(param.id)}
                  onClick={() => toggleParam(param.id)}
                  delay={0.5 + i * 0.1}
                />
              ))}
            </div>

            {/* Right Parameters */}
            <div className="flex flex-col gap-2 items-end">
              {PARAMETERS.right.map((param, i) => (
                <ParameterButton
                  key={param.id}
                  param={param}
                  isSelected={selectedParams.has(param.id)}
                  onClick={() => toggleParam(param.id)}
                  delay={0.7 + i * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Bottom Parameters */}
          <div className="flex justify-center gap-3 flex-wrap">
            {PARAMETERS.bottom.map((param, i) => (
              <ParameterButton
                key={param.id}
                param={param}
                isSelected={selectedParams.has(param.id)}
                onClick={() => toggleParam(param.id)}
                delay={0.9 + i * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Selected Count */}
        <motion.div 
          className="text-center mb-6"
          animate={{ opacity: selectedParams.size > 0 ? 1 : 0.5 }}
        >
          <span className="text-gray-400">
            {selectedParams.size} vibes selected
          </span>
        </motion.div>

        {/* Generate Button */}
        <div className="flex justify-center mb-8">
          <motion.button
            whileHover={{ scale: selectedParams.size > 0 ? 1.05 : 1 }}
            whileTap={{ scale: selectedParams.size > 0 ? 0.95 : 1 }}
            onClick={generatePrediction}
            disabled={selectedParams.size === 0 || isGenerating}
            className={`relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300
              ${selectedParams.size > 0 
                ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/30 cursor-pointer" 
                : "bg-slate-800 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  🔮
                </motion.span>
                सोच रहा हूं...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🎯</span>
                होगा क्या - Predict!
              </span>
            )}
            
            {/* Animated gradient overlay */}
            {selectedParams.size > 0 && (
              <motion.div
                className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-emerald-600/50 via-green-500/50 to-emerald-600/50"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            )}
          </motion.button>
        </div>

        {/* Prediction Result */}
        <AnimatePresence>
          {showResult && prediction && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="max-w-md mx-auto"
            >
              <motion.div
                className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-400/30 backdrop-blur-sm"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(34, 197, 94, 0.3)",
                    "0 0 40px rgba(34, 197, 94, 0.5)",
                    "0 0 20px rgba(34, 197, 94, 0.3)",
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {/* Sparkles */}
                <motion.div
                  className="absolute -top-2 -right-2 text-2xl"
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-2 text-2xl"
                  animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                >
                  ⭐
                </motion.div>

                <div className="text-center">
                  <motion.p 
                    className="text-2xl sm:text-3xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {prediction.text}
                  </motion.p>
                  <motion.p 
                    className="text-gray-400 text-sm italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {prediction.english}
                  </motion.p>
                </div>

                {/* Share to Feed Button */}
                <motion.div
                  className="mt-6 flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {!submitted ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={submitToFeed}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            ⏳
                          </motion.span>
                          Sharing...
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          Share to Feed
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 text-emerald-400"
                    >
                      <span className="text-xl">✅</span>
                      <span>Shared to feed!</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* View Feed Link */}
                {submitted && (
                  <motion.div
                    className="mt-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Link
                      href="/feed"
                      className="text-purple-400 hover:text-purple-300 text-sm underline"
                    >
                      View in feed →
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
