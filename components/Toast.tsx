"use client";

import React, { useEffect } from "react";

export type ToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: "success" | "info" | "warning";
};

export default function Toast({
  message,
  isVisible,
  onClose,
  duration = 2500,
  type = "success",
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-moya-text text-white border-moya-border shadow-soft",
    info: "bg-moya-primarydark text-white border-moya-primary shadow-soft",
    warning: "bg-amber-900 text-amber-50 border-amber-800 shadow-soft",
  };

  const icons = {
    success: "✓",
    info: "ℹ️",
    warning: "⚠️",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-card ${typeStyles[type]}`}
      >
        <span className="text-sm font-bold flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white">
          {icons[type]}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
