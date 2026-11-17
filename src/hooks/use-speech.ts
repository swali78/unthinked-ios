"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/**
 * Thin wrapper over the Web Speech API. Calls `onFinal` with the full
 * transcript when the speaker stops. `supported` is false on browsers
 * without it (e.g. Firefox), so callers can explain instead of failing.
 */
export function useSpeech(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(noopSubscribe, getCtorExists, () => true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string>();
  const rec = useRef<Recognition | null>(null);
  const latest = useRef("");
  const finalCb = useRef(onFinal);
  useEffect(() => {
    finalCb.current = onFinal;
  });

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join("");
      latest.current = text;
      setTranscript(text);
    };
    r.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone access is off. Allow it in your browser settings to talk to Unthinked."
          : e.error === "no-speech"
            ? "I didn't catch that. Tap the orb and try again."
            : "Voice input stopped. Try again or type your question.",
      );
    };
    r.onend = () => {
      setListening(false);
      const text = latest.current.trim();
      if (text) finalCb.current(text);
    };
    rec.current = r;
    return () => r.abort();
  }, []);

  const start = useCallback(() => {
    if (!rec.current) return;
    latest.current = "";
    setTranscript("");
    setError(undefined);
    try {
      rec.current.start();
      setListening(true);
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, transcript, error, start, stop };
}

const noopSubscribe = () => () => {};
function getCtor() {
  const w = window as unknown as Record<string, (new () => Recognition) | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const getCtorExists = () => Boolean(getCtor());
