// Draws the store icon and splash sources into assets/ from the orb in
// src/lib/orb-icon.tsx, then `npm run native:assets` turns them into every
// iOS and Android size. Re-run after changing the orb's colours.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BG = "#0b0b0c";
const out = new URL("../assets/", import.meta.url);
await mkdir(out, { recursive: true });

/** The orb face, centred in a square of `size`, orb diameter `orb`. */
function orbSvg(size, orb, { background = true } = {}) {
  const c = size / 2;
  const r = orb / 2;
  const eyeW = orb * 0.13;
  const eyeH = orb * 0.28;
  const eyeTop = c - r + orb * 0.34;
  const eyes = [0.31, 0.56]
    .map((left) => `<rect x="${c - r + orb * left}" y="${eyeTop}" width="${eyeW}" height="${eyeH}" rx="${eyeW / 2}" fill="#0C0C10"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="72%">
      <stop offset="0%" stop-color="#26323a"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
    <linearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4FA3B8"/>
      <stop offset="55%" stop-color="#E9C99F"/>
      <stop offset="100%" stop-color="#C9785A"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${orb * 0.08}"/>
    </filter>
  </defs>
  ${background ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : ""}
  <circle cx="${c}" cy="${c}" r="${r}" fill="#4FA3B8" opacity="0.45" filter="url(#glow)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#orb)"/>
  ${eyes}
</svg>`;
}

const png = (svg) => sharp(Buffer.from(svg)).png().toBuffer();
const files = {
  // iOS and the legacy Android icon: full bleed, no transparency (Apple rejects alpha).
  "icon-only.png": png(orbSvg(1024, 1024 * 0.7)).then((b) => sharp(b).flatten({ background: BG }).png().toBuffer()),
  // Android adaptive icon: the orb sits inside the 66% safe zone.
  "icon-foreground.png": png(orbSvg(1024, 1024 * 0.46, { background: false })),
  "icon-background.png": png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`),
  "splash.png": png(orbSvg(2732, 2732 * 0.16)),
  "splash-dark.png": png(orbSvg(2732, 2732 * 0.16)),
};

for (const [name, buf] of Object.entries(files)) {
  await writeFile(new URL(name, out), await buf);
  console.log("wrote assets/" + name);
}

// Google Play listing art: 512px icon and the 1024x500 feature graphic.
const store = new URL("../store/", import.meta.url);
await mkdir(store, { recursive: true });
await sharp(await files["icon-only.png"]).resize(512).png().toFile(new URL("play-icon-512.png", store).pathname);
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <defs><radialGradient id="g" cx="25%" cy="40%" r="80%"><stop offset="0%" stop-color="#26323a"/><stop offset="100%" stop-color="${BG}"/></radialGradient></defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <text x="400" y="230" font-family="Georgia, serif" font-style="italic" font-size="72" fill="#fff">Unthinked</text>
  <text x="402" y="290" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.7)">Flights, stays and visas, just by asking</text>
</svg>`;
const orb = await png(orbSvg(360, 220, { background: false }));
await sharp(Buffer.from(feature)).composite([{ input: orb, left: 30, top: 70 }]).png().toFile(new URL("play-feature-graphic.png", store).pathname);
console.log("wrote store/play-icon-512.png, store/play-feature-graphic.png");
