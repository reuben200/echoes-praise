import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

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

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error = useCallback((msg: string) => toast(msg, 'error'), [toast]);
  const info = useCallback((msg: string) => toast(msg, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed top-24 right-4 sm:right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none font-sans select-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto relative overflow-hidden bg-neutral-950/95 border border-neutral-900/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 w-full"
            >
              {/* Left Color Accent Strip */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  item.type === 'success'
                    ? 'bg-emerald-500'
                    : item.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-gold-500'
                }`}
              />

              {/* Icon Indicator */}
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                {item.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                {item.type === 'info' && (
                  <Info className="w-5 h-5 text-gold-400" />
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 text-xs text-gray-200 leading-relaxed font-medium">
                {item.message}
              </div>

              {/* Manual Close Button */}
              <button
                onClick={() => removeToast(item.id)}
                className="shrink-0 text-gray-550 hover:text-white transition p-0.5 rounded-lg hover:bg-neutral-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Progress Count-down Bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.5, ease: "linear" }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-60 ${
                  item.type === 'success'
                    ? 'bg-emerald-500/50'
                    : item.type === 'error'
                    ? 'bg-red-500/50'
                    : 'bg-gold-500/50'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
