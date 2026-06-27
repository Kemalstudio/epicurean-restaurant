import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Check, Heart, Music, Trash2, Info } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion'; 

const getToastIcon = (title) => {
  const t = title?.toLowerCase() || "";
  
  if (t.includes("liked")) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-primary shrink-0">
        <Heart className="w-4.5 h-4.5 fill-current text-primary" />
      </div>
    );
  }
  if (t.includes("removed") || t.includes("delete")) {
    return (
      <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center text-destructive shrink-0">
        <Trash2 className="w-4.5 h-4.5 text-destructive" />
      </div>
    );
  }
  if (t.includes("playlist") || t.includes("added") || t.includes("success")) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-primary shrink-0">
        <Check className="w-4.5 h-4.5 text-primary" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground shrink-0">
      <Info className="w-4.5 h-4.5 text-muted-foreground" />
    </div>
  );
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const latestToast = toasts[0];

  return (
    <ToastProvider swipeDirection="up" duration={3000}>
      <AnimatePresence mode="wait">
        {latestToast && latestToast.open && (
          <Toast 
            key={latestToast.id} 
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.92 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 260, 
                  damping: 24,    
                  mass: 0.8       
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                transition: { 
                  duration: 0.6, 
                  ease: "easeOut" 
                } 
              }}
              className="relative bg-card/85 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-2xl flex items-center gap-3 w-full sm:w-[340px] pointer-events-auto overflow-hidden"
            >
              {/* Иконка */}
              {getToastIcon(latestToast.title)}

              {/* Текстовый блок */}
              <div className="flex-1 min-w-0 pr-2">
                {latestToast.title && (
                  <ToastTitle className="text-sm font-semibold text-foreground tracking-tight">
                    {latestToast.title}
                  </ToastTitle>
                )}
                {latestToast.description && (
                  <ToastDescription className="text-xs text-muted-foreground mt-0.5 truncate leading-relaxed">
                    {latestToast.description}
                  </ToastDescription>
                )}
              </div>
              
              {/* Крестик закрытия */}
              <ToastClose 
                onClick={() => dismiss(latestToast.id)}
                className="text-muted-foreground/50 hover:text-foreground opacity-50 hover:opacity-100 transition-opacity" 
              />

              {/* Прогресс-линия */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500 rounded-b-2xl"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </motion.div>
          </Toast>
        )}
      </AnimatePresence>
      
      <ToastViewport 
        className="fixed top-6 z-[100] flex flex-col items-center w-full max-w-[360px] m-0 p-4 list-none outline-none pointer-events-none" 
        style={{ left: '50vw', transform: 'translateX(-50%)' }}  
      />
    </ToastProvider>
  );
}