"use client";

import { Check, Flag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { REPORT_REASONS, type ReportReason } from "@/lib/moderation";
import { type Traveler, together } from "@/lib/together";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet to report and block a traveler. The report goes to the
 * moderation team with the chat attached; the block is immediate.
 */
export function ReportSheet({
  person,
  context,
  onClose,
  onDone,
}: {
  person: Traveler | null;
  context: "profile" | "chat" | "discover";
  onClose: () => void;
  /** Called after the report is sent, e.g. to leave the screen. */
  onDone?: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const close = () => {
    if (state === "sent") onDone?.();
    onClose();
    setReason(null);
    setDetails("");
    setState("idle");
  };
  const submit = async () => {
    if (!person || !reason) return;
    setState("sending");
    try {
      await together.report(person.id, { reason, details: details.trim(), context });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <AnimatePresence>
      {person && (
        <motion.div
          className="absolute inset-0 z-40 flex items-end bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-label={`Report ${person.name}`}
            className="max-h-[88%] w-full overflow-y-auto rounded-t-[30px] border-t border-white/10 bg-[#141518] p-6 pb-9"
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
            exit={{ y: "100%", transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
            onClick={(e) => e.stopPropagation()}
          >
            {state === "sent" ? (
              <div className="py-4 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-6 text-[#8FD3E2]" />
                </span>
                <h3 className="mt-4 text-[18px] text-white">Thanks for telling us</h3>
                <p className="mt-2 text-[14px] leading-snug text-white/65">
                  {person.name} is blocked and can&apos;t see you or message you. Our team reviews every report within 24 hours.
                </p>
                <button type="button" onClick={close} className="mt-6 w-full rounded-full bg-white py-3 text-[15px] font-medium text-black">
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="flex items-center gap-2 text-[18px] text-white">
                  <Flag className="size-4 text-[#E9A58A]" /> Report {person.name}
                </h3>
                <p className="mt-1 text-[13.5px] text-white/60">They&apos;ll be blocked straight away. They won&apos;t know who reported them.</p>
                <div role="radiogroup" aria-label="Reason" className="mt-4 space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={reason === r.id}
                      onClick={() => setReason(r.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left text-[14.5px] transition-colors",
                        reason === r.id ? "bg-white text-black" : "bg-white/[0.06] text-white",
                      )}
                    >
                      {r.label}
                      {reason === r.id && <Check className="size-4" />}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="sr-only">More details</span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Anything else we should know? (optional)"
                    className="w-full resize-none rounded-[16px] bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                  />
                </label>
                {state === "error" && (
                  <p role="alert" className="mt-2 text-[13px] text-rose-300">
                    {person.name} is blocked, but the report didn&apos;t send. Check your connection and try again.
                  </p>
                )}
                <button
                  type="button"
                  disabled={!reason || state === "sending"}
                  onClick={submit}
                  className="mt-4 w-full rounded-full bg-[#C9785A] py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-40"
                >
                  {state === "sending" ? "Sending…" : "Report and block"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
