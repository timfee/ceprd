"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { usePRDStore } from "@/lib/store";

export function Overlay() {
  const hasChatStarted = usePRDStore((state) => state.hasChatStarted);
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hasChatStarted) {
      setIsExiting(true);
    }
  }, [hasChatStarted]);

  if (!mounted) {
    return null;
  }
  if (hasChatStarted && !isExiting) {
    return null;
  }

  if (isExiting && hasChatStarted) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md opacity-0 transition-opacity duration-700 ease-in-out pointer-events-none" />
    );
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-700 ease-in-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center space-y-6 px-8 max-w-lg">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-4 rounded-full border border-primary/20 shadow-lg">
              <MessageSquare
                className="w-8 h-8 text-primary"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground text-balance">
            Welcome to the PRD Copilot
          </h2>
          <p className="text-primary text-md">
            Start a chat by describing your vision
          </p>
        </div>
      </div>
    </div>
  );
}
