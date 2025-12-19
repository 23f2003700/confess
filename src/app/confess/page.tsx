"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import Image from "next/image";

// No AWS credentials or sensitive data here - all handled server-side

// Image compression utility - compresses images before upload for faster transfers
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is already small enough, don't compress
    if (file.size < 500 * 1024) { // Less than 500KB
      resolve(file);
      return;
    }

    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            // Only use compressed if it's actually smaller
            if (compressedFile.size < file.size) {
              console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          } else {
            resolve(file); // Fallback to original
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

export default function ConfessPage() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setNotification({ type: "error", text: "Only JPEG, PNG, GIF, WebP images allowed!" });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      // Validate file size (10MB max - will be compressed before upload)
      if (file.size > 10 * 1024 * 1024) {
        setNotification({ type: "error", text: "Image too large! Max 10MB allowed." });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview using URL.createObjectURL (faster than FileReader)
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Show file size info
      const sizeKB = (file.size / 1024).toFixed(0);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeMB}MB` : `${sizeKB}KB`;
      console.log(`Selected image: ${file.name} (${sizeStr})`);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const uploadImage = useCallback(async (retryCount = 0): Promise<string | null> => {
    if (!selectedImage) return null;
    
    const MAX_RETRIES = 2;
    setIsUploading(true);
    
    try {
      // Compress image first for faster upload
      setUploadProgress("Compressing...");
      const imageToUpload = await compressImage(selectedImage);
      
      setUploadProgress("Uploading...");
      const formData = new FormData();
      formData.append('image', imageToUpload);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setUploadProgress("");
      return data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setUploadProgress(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return uploadImage(retryCount + 1);
      }
      
      setUploadProgress("");
      throw error;
    } finally {
      if (retryCount === 0 || retryCount >= MAX_RETRIES) {
        setIsUploading(false);
      }
    }
  }, [selectedImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // First upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadImage();
        } catch {
          setNotification({ type: "error", text: "Failed to upload image. Try again!" });
          setTimeout(() => setNotification(null), 4000);
          setIsSubmitting(false);
          return;
        }
      }

      // Send to our secure API route (server-side handles everything)
      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message.trim() || "📸", // Default message if only image
          imageUrl 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PROFANITY') {
          setNotification({ type: "error", text: "अच्छा लिखो 🙏 No bad words please!" });
        } else if (response.status === 429) {
          setNotification({ type: "error", text: "Too fast! Wait a moment 🙏" });
        } else {
          setNotification({ type: "error", text: data.error || "Something went wrong. Try again!" });
        }
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      setMessage("");
      removeImage();
      setNotification({ type: "success", text: "Your confession has been shared! 💜" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error:', error);
      setNotification({ type: "error", text: "Connection error. Try again!" });
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

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
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
                rows={4}
                className="w-full resize-none rounded-2xl border-0 bg-slate-800/50 
                           p-4 text-white text-lg placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-cyan-400/30
                           transition-all duration-300"
              />

              {/* Image Preview */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-4 relative"
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={400}
                        height={300}
                        className="w-full h-auto max-h-60 object-cover"
                      />
                      <motion.button
                        type="button"
                        onClick={removeImage}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg"
                      >
                        ✕
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image Upload Buttons */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {/* Camera Button */}
                <motion.button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                             border border-pink-500/30 px-4 py-2.5 text-pink-300
                             hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
                >
                  <span className="text-lg">📷</span>
                  <span className="text-sm font-medium">Camera</span>
                </motion.button>

                {/* Gallery Button */}
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                             border border-blue-500/30 px-4 py-2.5 text-blue-300
                             hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
                >
                  <span className="text-lg">🖼️</span>
                  <span className="text-sm font-medium">Gallery</span>
                </motion.button>
              </div>
              
              <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm text-gray-500">
                  {message.length}/500
                  {selectedImage && <span className="ml-2 text-cyan-400">• 📎 Image</span>}
                </span>
                <motion.button
                  type="submit"
                  disabled={(!message.trim() && !selectedImage) || isSubmitting}
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
                      {uploadProgress || (isUploading ? "Uploading..." : "Sending...")}
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
