'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface TransitionScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const statusMessages = [
  "Preparing your workspace",
  "Restoring your context",
  "Loading your environment"
];

export function TransitionScreen({ isVisible, onComplete }: TransitionScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const [message] = useState(() =>
    statusMessages[Math.floor(Math.random() * statusMessages.length)]
  );

  useEffect(() => {
    if (isVisible && onComplete) {
      // Intentional delay between 800ms and 1500ms
      const timer = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void-950 text-starlight-100"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center space-y-12">
            {/* Brand Mark */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="relative w-16 h-16 grayscale opacity-80"
            >
              <Image
                src="/Logo1.jpg"
                alt="Engunity Brand Mark"
                fill
                className="object-cover rounded-lg"
                priority
              />
            </motion.div>

            {/* Status Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col items-center space-y-6"
            >
              <span className="text-starlight-400 font-medium tracking-wide text-sm md:text-base">
                {message}
              </span>

              {/* Subtle shimmer line - Hidden if reduced motion is preferred */}
              {!shouldReduceMotion && (
                <div className="relative w-32 h-[1px] bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                  />
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
