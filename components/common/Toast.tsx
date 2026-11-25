"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning";

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  onClose: () => void;
}

const DISPLAY_DURATION = 3500;
const EXIT_DURATION = 250;

export default function Toast({ type, title, message, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const dismiss = useCallback(() => {
    if (isLeaving) return;
    setIsLeaving(true);

    setTimeout(onClose, EXIT_DURATION);
  }, [isLeaving, onClose]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismiss, DISPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [dismiss]);

  const config = {
    success: {
      Icon: CheckCircle2,
      iconColor: "text-[#079d98]",
      iconBg: "bg-[#e5f7f4]",
      border: "border-[#bcebe5]",
      progress: "bg-[#079d98]",
    },
    error: {
      Icon: AlertCircle,
      iconColor: "text-[#dc2626]",
      iconBg: "bg-[#fff0f0]",
      border: "border-[#fecaca]",
      progress: "bg-[#dc2626]",
    },
    warning: {
      Icon: Info,
      iconColor: "text-[#dc2626]",
      iconBg: "bg-[#fff0f0]",
      border: "border-[#fecaca]",
      progress: "bg-[#dc2626]",
    },
  };

  const style = config[type];
  const Icon = style.Icon;

  if (!isMounted) return null;

  return createPortal(
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`fixed left-1/2 top-5 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 ${
        isLeaving ? "toast-gooey-exit" : "toast-gooey-enter"
      }`}
    >
      <div
        className={`overflow-hidden rounded-2xl border ${style.border} bg-white shadow-xl shadow-[#123d4a]/10`}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
          >
            <Icon size={21} className={style.iconColor} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-sm font-semibold text-[#123d4a]">{title}</h3>

            <p className="mt-1 text-sm leading-5 text-[#70858a]">{message}</p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Close notification"
            className="rounded-lg p-1 text-[#829397] transition hover:bg-[#f1f7f6] hover:text-[#123d4a]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="h-1 w-full bg-[#edf3f2]">
          <div
            className={`toast-countdown h-full ${style.progress}`}
            style={{ animationDuration: `${DISPLAY_DURATION}ms` }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
