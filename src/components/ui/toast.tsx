"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, 3800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icon = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />,
    error: <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0" />,
  }[toast.type];

  const borderColor = {
    success: "border-green-500/20",
    error: "border-red-500/20",
    info: "border-blue-500/20",
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${borderColor} bg-card shadow-lg max-w-sm transition-all duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {icon}
      <p className="text-sm text-foreground flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 200);
        }}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
