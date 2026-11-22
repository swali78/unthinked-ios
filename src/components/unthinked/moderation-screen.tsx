"use client";

import { Ban, Check, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/moderation";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { Screen } from "./screen";

type Report = {
  id: string;
  reason: (typeof REPORT_REASONS)[number]["id"];
  details: string;
  context: string;
  status: "open" | "dismissed" | "suspended";
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
  evidence: { profile: { name: string; bio: string; fromCity: string | null; interests: string[] } | null; messages: { text: string; at: number }[] };
  reporter: { id: string; name: string; email: string | null };
  target: { id: string; name: string; email: string | null; suspended: boolean; timesReported: number };
};

const TABS = [
  { id: "open", label: "To review" },
  { id: "all", label: "All" },
] as const;

const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;
const when = (ms: number) => new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The moderation queue, for emails listed in UNTHINKED_ADMIN_EMAILS. */
export function ModerationScreen() {
  const { status } = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("open");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (status !== "signed-in") return;
    let live = true;
    api<{ reports: Report[] }>(`/admin/reports?status=${tab}`)
      .then((r) => {
        if (!live) return;
        setReports(r.reports);
        setError(null);
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof ApiError && err.status === 403 ? "Only moderators can see reports." : "Couldn't load reports.");
      });
    return () => {
      live = false;
    };
  }, [status, tab, version]);

  const act = async (id: string, action: "dismiss" | "suspend" | "reopen") => {
    await api(`/admin/reports/${id}`, { method: "POST", body: { action } });
    reload();
  };
  const unsuspend = async (userId: string) => {
    await api(`/admin/users/${userId}/unsuspend`, { method: "POST" });
    reload();
  };

  return (
    <Screen title={<SerifAccent>Reports</SerifAccent>} back="/account">
      {status === "signed-out" ? (
        <p className="pt-10 text-center text-[14px] text-white/60">Sign in with a moderator account to review reports.</p>
      ) : error ? (
        <p className="pt-10 text-center text-[14px] text-white/60">{error}</p>
      ) : (
        <>
          <p className="px-1 text-[13px] text-white/55">
            Apple and Google expect every report to be handled within 24 hours. Suspending signs the person out everywhere, hides them and blocks sign-in.
          </p>
          <div role="tablist" className="mt-4 flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn("rounded-full px-4 py-2 text-[13.5px]", tab === t.id ? "bg-white text-black" : "glass-thin text-white")}
              >
                {t.label}
              </button>
            ))}
          </div>

          {reports === null ? (
            <p className="pt-10 text-center text-[14px] text-white/50">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="pt-12 text-center">
              <Check className="mx-auto size-8 text-[#8FD3E2]" />
              <p className="mt-3 text-[15px] text-white">{tab === "open" ? "Nothing to review" : "No reports yet"}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {reports.map((r) => (
                <ReportCard key={r.id} r={r} onAct={act} onUnsuspend={unsuspend} />
              ))}
            </ul>
          )}
        </>
      )}
    </Screen>
  );
}

function ReportCard({ r, onAct, onUnsuspend }: { r: Report; onAct: (id: string, a: "dismiss" | "suspend" | "reopen") => Promise<void>; onUnsuspend: (userId: string) => Promise<void> }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <li className="glass rounded-[24px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-medium text-white">
            <ShieldAlert className="size-4 shrink-0 text-[#E9A58A]" /> {reasonLabel(r.reason)}
          </p>
          <p className="mt-0.5 text-[12px] text-white/45">
            {when(r.createdAt)} · from {r.context}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11.5px]",
            r.status === "open" ? "bg-[#C9785A]/25 text-[#E9A58A]" : r.status === "suspended" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/60",
          )}
        >
          {r.status === "open" ? "Open" : r.status === "suspended" ? "Suspended" : "Dismissed"}
        </span>
      </div>

      <dl className="mt-3 space-y-1 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-white/45">Reported</dt>
          <dd className="min-w-0 text-white">
            {r.target.name} <span className="text-white/50">{r.target.email ?? "demo traveler"}</span>
            {r.target.timesReported > 1 && <span className="ml-1 text-[#E9A58A]">· reported {r.target.timesReported} times</span>}
            {r.target.suspended && <span className="ml-1 text-rose-300">· suspended</span>}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-white/45">By</dt>
          <dd className="min-w-0 text-white">
            {r.reporter.name} <span className="text-white/50">{r.reporter.email}</span>
          </dd>
        </div>
      </dl>

      {r.details && <p className="mt-3 rounded-[14px] bg-white/[0.06] px-3 py-2 text-[13.5px] text-white/85">&ldquo;{r.details}&rdquo;</p>}

      {r.evidence.profile?.bio && <p className="mt-3 text-[12.5px] text-white/55">Bio: {r.evidence.profile.bio}</p>}
      {r.evidence.messages.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] text-white/70">Their messages to the reporter ({r.evidence.messages.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {r.evidence.messages.map((m, i) => (
              <li key={i} className="rounded-[12px] bg-white/[0.05] px-3 py-1.5 text-[13px] text-white/80">
                {m.text} <span className="ml-1 text-[11px] text-white/35">{when(m.at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {r.reviewedAt && <p className="mt-3 text-[11.5px] text-white/40">Reviewed {when(r.reviewedAt)} by {r.reviewedBy}</p>}

      <div className="mt-4 flex gap-2">
        {r.status === "open" ? (
          <>
            <button type="button" disabled={busy} onClick={() => run(() => onAct(r.id, "dismiss"))} className="glass-thin flex-1 rounded-full py-2.5 text-[14px] text-white disabled:opacity-50">
              Dismiss
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirm ? run(() => onAct(r.id, "suspend")) : setConfirm(true))}
              onBlur={() => setConfirm(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-500/90 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
            >
              <Ban className="size-4" /> {confirm ? `Suspend ${r.target.name}?` : "Suspend"}
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => run(() => onAct(r.id, "reopen"))} className="glass-thin flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] text-white disabled:opacity-50">
              <RotateCcw className="size-4" /> Reopen
            </button>
            {r.target.suspended && (
              <button type="button" disabled={busy} onClick={() => run(() => onUnsuspend(r.target.id))} className="glass-thin flex-1 rounded-full py-2.5 text-[14px] text-white disabled:opacity-50">
                Lift suspension
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
