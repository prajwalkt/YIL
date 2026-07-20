"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  /** Optional fallback route if history is empty */
  fallbackPath?: string;
  /** Custom click handler (useful for modals instead of routing) */
  onClick?: () => void;
  /** Whether there are unsaved changes on the current view */
  hasUnsavedChanges?: boolean;
  /** Custom class names */
  className?: string;
  /** Label text. Defaults to "Back" */
  label?: string;
}

export default function BackButton({ 
  fallbackPath = "/", 
  onClick, 
  hasUnsavedChanges = false, 
  className = "",
  label = "Back"
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmBack = window.confirm("You have unsaved changes. Are you sure you want to go back?");
      if (!confirmBack) return;
    }

    if (onClick) {
      onClick();
      return;
    }

    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <button 
      onClick={handleBack} 
      className={`flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors ${className}`}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
