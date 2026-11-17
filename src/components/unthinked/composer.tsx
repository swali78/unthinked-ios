"use client";

import { ArrowUp, Mic, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { AIOrb } from "./ai-orb";

type ComposerProps = {
  onSubmit: (text: string) => void;
  onMic?: () => void;
  listening?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/** The pill input from the reference: plus, text, mic, and the orb as send. */
export function Composer({
  onSubmit,
  onMic,
  listening,
  disabled,
  placeholder = "Ask destinations, hotels, visas…",
  className,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasText || disabled) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={submit} className={cn("flex items-center gap-2.5", className)}>
      <div className="glass-thin flex h-[52px] min-w-0 flex-1 items-center gap-1 rounded-full pl-1.5 pr-1.5">
        <button
          type="button"
          aria-label="Add attachment"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/70 hover:text-white"
        >
          <Plus className="size-[18px]" />
        </button>
        <label htmlFor="composer" className="sr-only">
          Message Unthinked
        </label>
        <input
          id="composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="send"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/45 focus:outline-none"
        />
        {onMic && (
          <button
            type="button"
            onClick={onMic}
            aria-label={listening ? "Stop listening" : "Speak to Unthinked"}
            aria-pressed={listening}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              listening ? "bg-white text-black" : "text-white/70 hover:text-white",
            )}
          >
            <Mic className="size-[18px]" />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Send"
        disabled={disabled}
        className="relative shrink-0 rounded-full transition-transform active:scale-[0.96] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
      >
        <AIOrb size={52} />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-white text-black transition-[opacity,transform] duration-200",
            hasText ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
          <ArrowUp className="size-5" strokeWidth={2.4} />
        </span>
      </button>
    </form>
  );
}
