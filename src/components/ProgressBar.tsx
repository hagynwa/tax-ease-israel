"use client";

import { motion } from "framer-motion";

const STEP_LABELS = [
  "מטרה",
  "שנה",
  "פרטים",
  "הטבות",
  "מסמכים",
  "תוצאות",
  "טופס",
  "סיום",
];

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = STEP_LABELS.slice(0, totalSteps || STEP_LABELS.length);

  return (
    <div className="w-full max-w-3xl mx-auto px-2 py-3">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
        {/* Progress fill */}
        <motion.div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ maxWidth: "calc(100% - 2rem)" }}
        />

        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={i} className="relative flex flex-col items-center z-10" style={{ minWidth: 0, flex: 1 }}>
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-blue-500 border-blue-500 text-white"
                    : isActive
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-black/60 border-white/10 text-neutral-500"
                }`}
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isCompleted ? "✓" : i + 1}
              </motion.div>
              <span
                className={`mt-1.5 text-[9px] font-medium text-center leading-tight hidden sm:block ${
                  isActive ? "text-blue-400" : isCompleted ? "text-neutral-300" : "text-neutral-600"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
