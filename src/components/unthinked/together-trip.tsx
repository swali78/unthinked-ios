"use client";

import { Check, Plus, Receipt, Sparkles, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { photo } from "@/lib/photo";
import { balances, nameOf, together, travelerById, useTogether } from "@/lib/together";
import { Chip, SerifAccent } from "./primitives";
import { Screen } from "./screen";
import { Avatar, ME_AVATAR } from "./together-discover";

const money = (n: number) => `$${n.toFixed(2).replace(/\.00$/, "")}`;
const avatarOf = (id: string) => (id === "me" ? ME_AVATAR : travelerById(id) ?? ME_AVATAR);

/** A group trip: plan together, then split costs and pay later. */
export function TogetherTrip() {
  const params = useSearchParams();
  const s = useTogether();
  const id = params.get("id") ?? s.groups[0]?.id;
  const g = s.groups.find((x) => x.id === id);
  const [tab, setTab] = useState<"plan" | "split">(params.get("tab") === "split" ? "split" : "plan");
  const [idea, setIdea] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", paidBy: "me" });
  const [problem, setProblem] = useState<string | null>(null);

  if (!g) {
    return (
      <Screen title="Group trip" back="/together/chats">
        <p className="pt-10 text-center text-[15px] text-white/60">This trip isn&apos;t available any more.</p>
      </Screen>
    );
  }
  const total = g.expenses.reduce((a, e) => a + e.amount, 0);
  const owed = balances(g);

  const addIdea = () => {
    if (!idea.trim()) return;
    const problem = together.addPlan(g.id, idea.trim());
    setProblem(problem);
    if (!problem) setIdea("");
  };
  const saveExpense = () => {
    const amount = parseFloat(form.amount);
    if (!form.title.trim() || !(amount > 0)) return;
    const problem = together.addExpense(g.id, { title: form.title.trim(), amount, paidBy: form.paidBy, splitWith: g.members });
    setProblem(problem);
    if (problem) return;
    setForm({ title: "", amount: "", paidBy: "me" });
    setAdding(false);
  };

  return (
    <Screen
      title={g.title}
      back="/together"
      overlay={
        <AnimatePresence>
          {adding && (
            <motion.div className="absolute inset-0 z-30 flex items-end bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} onClick={() => setAdding(false)}>
              <motion.div
                className="w-full rounded-t-[30px] border-t border-white/10 bg-[#141518] p-6 pb-9"
                initial={{ y: "100%" }}
                animate={{ y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
                exit={{ y: "100%", transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[18px] text-white">Add an <SerifAccent>expense</SerifAccent></h3>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What was it? e.g. Dinner in Seminyak" className="glass-thin mt-4 h-12 w-full rounded-2xl px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none" />
                {problem && <p role="alert" className="mt-2 px-1 text-[12.5px] text-rose-300">{problem}</p>}
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="Amount (USD)" className="glass-thin mt-2.5 h-12 w-full rounded-2xl px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none" />
                <p className="mt-4 text-[13px] text-white/55">Paid by</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.members.map((m) => (
                    <Chip key={m} selected={form.paidBy === m} onClick={() => setForm({ ...form, paidBy: m })}>{nameOf(m)}</Chip>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-white/55">
                  Split equally between all {g.members.length}
                  {parseFloat(form.amount) > 0 ? `: ${money(parseFloat(form.amount) / g.members.length)} each` : ""}
                </p>
                <button type="button" onClick={saveExpense} className="mt-5 w-full rounded-full bg-white py-3.5 text-[15px] font-medium text-black transition-transform active:scale-[0.97]">
                  Add expense
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      }
    >
      <div className="relative h-[150px] overflow-hidden rounded-[26px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...photo(g.image, 360, 150)} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <div>
            <p className="text-[20px] leading-tight text-white">{g.destination}</p>
            <p className="text-[12.5px] text-white/70">{g.dates} · {g.members.length} travelers</p>
          </div>
          <div className="flex -space-x-2">
            {g.members.map((m) => <Avatar key={m} t={avatarOf(m)} size={34} />)}
          </div>
        </div>
      </div>

      <div className="glass-thin mt-4 grid grid-cols-2 rounded-full p-1">
        {(["plan", "split"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className="relative h-10 rounded-full text-[14px] font-medium">
            {tab === k && <motion.span layoutId="trip-tab" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className={`relative ${tab === k ? "text-black" : "text-white/75"}`}>{k === "plan" ? "Plan together" : "Split costs"}</span>
          </button>
        ))}
      </div>

      {tab === "plan" ? (
        <div className="mt-4">
          <ul className="space-y-2">
            {g.plan.map((p) => (
              <li key={p.id} className="glass flex items-center gap-3 rounded-[20px] p-3.5">
                <span className="w-12 text-[12px] font-medium text-[#E9C99F]">{p.day}</span>
                <span className="flex-1 text-[14.5px] text-white/90">{p.title}</span>
                <button type="button" onClick={() => together.vote(g.id, p.id)} aria-label={`Vote for ${p.title}`} className="glass-thin flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-white transition-transform active:scale-[0.96]">
                  <ThumbsUp className="size-3.5" /> {p.votes}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); addIdea(); }} className="mt-3 flex gap-2">
            <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Suggest something to do" className="glass-thin h-12 flex-1 rounded-full px-5 text-[16px] text-white placeholder:text-white/40 focus:outline-none" />
            <button type="submit" aria-label="Add idea" className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-[0.96]"><Plus className="size-5" /></button>
          </form>
          {problem && !adding && <p role="alert" className="mt-2 px-2 text-[12.5px] text-rose-300">{problem}</p>}
          <Link href={`/chat?q=${encodeURIComponent(`Plan 5 days in ${g.destination} for ${g.members.length} people`)}`} className="glass mt-3 flex items-center gap-3 rounded-[20px] p-3.5 transition-transform active:scale-[0.98]">
            <Sparkles className="size-5 text-[#E9C99F]" />
            <span className="text-[14px] text-white/85">Ask Unthinked to draft the plan</span>
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-[26px] p-5" style={{ background: "linear-gradient(135deg, rgb(79 163 184 / 0.28), rgb(201 120 90 / 0.22))" }}>
            <p className="text-[13px] text-white/65">Shared so far</p>
            <p className="mt-1 text-[38px] font-medium leading-none tracking-[-0.03em] text-white">{money(total)}</p>
            <p className="mt-2 text-[13px] text-white/70">
              {money(total / g.members.length)} <SerifAccent>each</SerifAccent>, split equally
            </p>
          </div>

          <h2 className="mb-2 mt-5 px-1 text-[13px] text-white/60">Pay later</h2>
          {owed.length === 0 ? (
            <p className="glass rounded-[20px] p-4 text-[14px] text-white/80">Everyone is settled up 🎉</p>
          ) : (
            <ul className="space-y-2">
              {owed.map((b) => (
                <li key={`${b.from}-${b.to}`} className="glass flex items-center gap-3 rounded-[20px] p-3.5">
                  <Avatar t={avatarOf(b.from)} size={36} />
                  <span className="flex-1 text-[14px] text-white/80">
                    <b className="font-medium text-white">{nameOf(b.from)}</b> {b.from === "me" ? "owe" : "owes"} <b className="font-medium text-white">{nameOf(b.to)}</b>
                  </span>
                  <span className="text-[15px] font-medium text-white">{money(b.amount)}</span>
                  <button type="button" onClick={() => together.settle(g.id, b.from, b.to, b.amount)} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium text-black transition-transform active:scale-[0.96]">
                    <Check className="size-3.5" /> Paid
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-2 mt-5 px-1 text-[13px] text-white/60">Expenses</h2>
          <ul className="space-y-2">
            {g.expenses.map((e) => (
              <li key={e.id} className="glass flex items-center gap-3 rounded-[20px] p-3.5">
                <Receipt className="size-5 text-white/50" />
                <div className="flex-1">
                  <p className="text-[14.5px] text-white">{e.title}</p>
                  <p className="text-[12px] text-white/50">Paid by {nameOf(e.paidBy)} · split {e.splitWith.length} ways</p>
                </div>
                <span className="text-[15px] text-white">{money(e.amount)}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setAdding(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[15px] font-medium text-black transition-transform active:scale-[0.97]">
            <Plus className="size-4" /> Add expense
          </button>
          <p className="mt-3 text-center text-[11.5px] text-white/35">Unthinked tracks who owes what between people on this trip. Settle up however you like.</p>
        </div>
      )}
    </Screen>
  );
}
