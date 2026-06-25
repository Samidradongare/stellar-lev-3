"use client";

import React, { createContext, useContext, useState } from "react";
import confetti from "canvas-confetti";

export interface ToastNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  txHash?: string;
  itemId?: string;
  timestamp: Date;
}

interface EventContextType {
  notifications: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date()
    };
    setNotifications((prev) => [newToast, ...prev].slice(0, 10)); // Keep last 10
  };

  const removeToast = (id: string) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF6B00", "#1A237E", "#FFFFFF", "#FFD700"]
    });
  };

  return (
    <EventContext.Provider value={{ notifications, addToast, removeToast, triggerConfetti }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};
