"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usd } from "@/lib/data/booking";
import type { Hotel } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const TILE = 256;

/** Web-Mercator projection to world pixels at zoom z. */
function project(lat: number, lng: number, z: number) {
  const s = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * s,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s,
  };
}

/**
 * A lightweight static map: dark CARTO tiles plus price pins. No map SDK or
 * API key; it fits the zoom to the hotels and doesn't pan.
 */
export function StayMap({
  hotels,
  selected,
  onSelect,
  className,
  maxZoom = 15,
}: {
  hotels: Hotel[];
  selected?: string;
  onSelect: (id: string) => void;
  className?: string;
  maxZoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 560 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = useMemo(() => {
    if (hotels.length === 0) return null;
    // Highest zoom where every pin fits with padding.
    let z = maxZoom;
    for (; z > 3; z--) {
      const pts = hotels.map((h) => project(h.lat, h.lng, z));
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      if (Math.max(...xs) - Math.min(...xs) < size.w * 0.7 && Math.max(...ys) - Math.min(...ys) < size.h * 0.55) break;
    }
    const pts = hotels.map((h) => project(h.lat, h.lng, z));
    const cx = (Math.max(...pts.map((p) => p.x)) + Math.min(...pts.map((p) => p.x))) / 2;
    // Nudge the centre up so pins sit above the bottom card.
    const cy = (Math.max(...pts.map((p) => p.y)) + Math.min(...pts.map((p) => p.y))) / 2 + size.h * 0.1;
    const ox = cx - size.w / 2;
    const oy = cy - size.h / 2;
    const tiles: { key: string; url: string; left: number; top: number }[] = [];
    const n = 2 ** z;
    for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + size.w) / TILE); tx++) {
      for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + size.h) / TILE); ty++) {
        if (ty < 0 || ty >= n) continue;
        const wx = ((tx % n) + n) % n;
        tiles.push({
          key: `${z}-${tx}-${ty}`,
          // OSM standard tiles (no key). Dev/demo volume only: production
          // traffic needs a commercial tile provider per the OSM tile policy.
          url: `https://tile.openstreetmap.org/${z}/${wx}/${ty}.png`,
          left: tx * TILE - ox,
          top: ty * TILE - oy,
        });
      }
    }
    // Nudge pins that would overlap so every price stays tappable.
    const placed: { h: Hotel; x: number; y: number }[] = [];
    hotels
      .map((h, i) => ({ h, x: pts[i].x - ox, y: pts[i].y - oy }))
      .sort((a, b) => a.y - b.y)
      .forEach((p) => {
        const clear = (x: number, y: number) => !placed.some((q) => Math.abs(q.x - x) < 64 && Math.abs(q.y - y) < 30);
        // Smallest move that frees the pin: sideways first, then up/down.
        const offsets = [[0, 0], [68, 0], [-68, 0], [0, -32], [0, 32], [68, -32], [-68, -32], [68, 32], [-68, 32], [0, -64], [0, 64]];
        const [dx, dy] = offsets.find(([ax, ay]) => clear(p.x + ax, p.y + ay)) ?? [0, 0];
        placed.push({ ...p, x: p.x + dx, y: p.y + dy });
      });
    return { tiles, pins: placed };
  }, [hotels, size, maxZoom]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-[#0e0f11]", className)} role="region" aria-label="Map of stays">
      {view?.tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.key}
          src={t.url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute select-none"
          // Turn the light OSM style into a graphite night map.
          style={{
            left: t.left,
            top: t.top,
            width: TILE,
            height: TILE,
            filter: "invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.92) saturate(0.25)",
          }}
        />
      ))}
      {/* Vignette keeps pins readable */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,transparent_40%,rgb(11_11_12/0.75))]" />
      {view?.pins
        .slice()
        .sort((a, b) => Number(a.h.id === selected) - Number(b.h.id === selected))
        .map(({ h, x, y }) => {
          const on = h.id === selected;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSelect(h.id)}
              aria-pressed={on}
              aria-label={`${h.name}, ${usd(h.pricePerNight)} per night`}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-full rounded-full px-2.5 py-1 text-[12.5px] font-semibold tabular-nums shadow-[0_6px_16px_rgb(0_0_0/0.5)] transition-transform",
                on ? "z-10 scale-110 bg-white text-black" : "glass-thin text-white hover:scale-105",
              )}
              style={{ left: x, top: y }}
            >
              {usd(h.pricePerNight)}
            </button>
          );
        })}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-2 top-1 rounded bg-black/40 px-1 text-[9px] text-white/55"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}
