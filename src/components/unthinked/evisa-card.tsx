"use client";

import { type VisaApplication, visaNumber, visaValidity } from "@/lib/data/visa";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Deterministic 21×21 pattern from the visa number, drawn like a QR code (decorative). */
function codeCells(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const n = 21;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const x = i % n;
    const y = Math.floor(i / n);
    const finder = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) {
      const lx = x % 14 === x ? x : x - 14;
      const ly = y % 14 === y ? y : y - 14;
      const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
      const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
      cells.push(ring || core);
    } else cells.push((h >>> 7) % 2 === 0);
  }
  return { n, cells };
}

export function Code({ seed, size = 92 }: { seed: string; size?: number }) {
  const { n, cells } = codeCells(seed);
  const c = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-[8px] bg-white p-1.5" aria-label="Verification code">
      {cells.map((on, i) =>
        on ? <rect key={i} x={(i % n) * c} y={Math.floor(i / n) * c} width={c + 0.2} height={c + 0.2} fill="#0b0b0c" /> : null,
      )}
    </svg>
  );
}

export function EVisaCard({ app }: { app: VisaApplication }) {
  const { from, until } = visaValidity(app);
  const no = visaNumber(app);
  return (
    <article
      className="relative overflow-hidden rounded-[28px] p-5 text-white shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.18)]"
      style={{ background: "radial-gradient(120% 90% at 0% 0%, #3a3a3e 0%, #1c1c1f 55%, #121214 100%)" }}
      aria-label={`${app.destination} e-visa for ${app.applicant.firstName} ${app.applicant.lastName}`}
    >
      {/* Guilloche-style sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25"
        style={{ background: "repeating-radial-gradient(circle, transparent 0 6px, rgb(255 255 255 / 0.18) 6px 7px)" }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[12px] text-white/55">Electronic visa</p>
          <p className="mt-0.5 text-[26px] font-medium leading-tight tracking-tight">
            {app.destination} <em className="serif-accent text-white/70">{app.type}</em>
          </p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11.5px] font-medium text-emerald-300">Approved</span>
      </div>
      <dl className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
        <Item k="Holder" v={`${app.applicant.firstName} ${app.applicant.lastName}`} wide />
        <Item k="Passport" v={app.applicant.passport} />
        <Item k="Visa no." v={no} />
        <Item k="Valid from" v={fmt(from)} />
        <Item k="Valid until" v={fmt(until)} />
      </dl>
      <div className="relative mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
        <dl className="grid flex-1 grid-cols-2 gap-x-4 text-[12px]">
          <Item k="Entries" v="Single" />
          <Item k="Max stay" v={`${app.maxStayDays} days`} />
        </dl>
        <Code seed={no} size={76} />
      </div>
    </article>
  );
}

function Item({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-white/45">{k}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-medium tabular-nums text-white">{v}</dd>
    </div>
  );
}

/** Renders the e-visa to a PNG and downloads it. */
export async function downloadEVisa(app: VisaApplication) {
  const W = 1200;
  const H = 760;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't create images. Take a screenshot of the card instead.");
  const family = getComputedStyle(document.body).fontFamily;
  const { from, until } = visaValidity(app);
  const no = visaNumber(app);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W);
  g.addColorStop(0, "#3a3a3e");
  g.addColorStop(0.55, "#1c1c1f");
  g.addColorStop(1, "#121214");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 56);
  ctx.fill();

  const text = (s: string, x: number, y: number, size: number, color = "#f2f1ee", weight = 500) => {
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  };
  text("Electronic visa", 64, 96, 26, "rgba(242,241,238,0.55)", 400);
  text(`${app.destination} ${app.type}`, 64, 160, 56);
  ctx.fillStyle = "rgba(52,211,153,0.16)";
  ctx.beginPath();
  ctx.roundRect(W - 230, 64, 166, 52, 26);
  ctx.fill();
  text("Approved", W - 202, 100, 26, "#6ee7b7", 600);

  const rows: [string, string][] = [
    ["Holder", `${app.applicant.firstName} ${app.applicant.lastName}`],
    ["Passport", app.applicant.passport],
    ["Visa no.", no],
    ["Valid from", fmt(from)],
    ["Valid until", fmt(until)],
    ["Entries", "Single"],
    ["Max stay", `${app.maxStayDays} days`],
    ["Purpose", app.travel.purpose],
  ];
  rows.forEach(([k, v], i) => {
    const x = 64 + (i % 2) * 360;
    const y = 280 + Math.floor(i / 2) * 110;
    text(k, x, y, 24, "rgba(242,241,238,0.45)", 400);
    text(v, x, y + 40, 32, "#f2f1ee", 500);
  });

  const { n, cells } = codeCells(no);
  const size = 300;
  const ox = W - 64 - size;
  const oy = H - 64 - size;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(ox - 16, oy - 16, size + 32, size + 32, 20);
  ctx.fill();
  ctx.fillStyle = "#0b0b0c";
  const c = size / n;
  cells.forEach((on, i) => on && ctx.fillRect(ox + (i % n) * c, oy + Math.floor(i / n) * c, c + 0.5, c + 0.5));
  text("Demo document · not valid for travel", 64, H - 56, 22, "rgba(242,241,238,0.4)", 400);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Couldn't create the image. Try again.");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `e-visa-${app.destination.toLowerCase().replace(/\W+/g, "-")}-${app.id}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
