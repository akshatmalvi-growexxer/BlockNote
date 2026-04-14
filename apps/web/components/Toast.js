"use client";

import { useEffect } from "react";

export default function Toast({ message, tone = "error", onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message || !duration) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span>{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      ) : null}
    </div>
  );
}
