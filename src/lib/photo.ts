/**
 * Sharp Unsplash photos at any size.
 *
 * Give the size the image is *displayed* at (CSS px). Returns `src` + `srcSet`
 * with 1×, 2× and 3× variants cropped to that exact box, so Retina and
 * Super Retina phones get pixel-dense images without over-downloading.
 *
 *   <img {...photo(d.image, 140, 190)} alt="" />
 */
export function photo(src: string, width: number, height?: number, quality = 85) {
  const base = src.split("?")[0];
  const url = (dpr: number) =>
    `${base}?auto=format&fit=crop&crop=entropy&w=${Math.round(width)}${height ? `&h=${Math.round(height)}` : ""}&dpr=${dpr}&q=${quality}`;
  return {
    src: url(2),
    srcSet: `${url(1)} 1x, ${url(2)} 2x, ${url(3)} 3x`,
    // Decode off the main thread so scrolling past photos stays smooth.
    decoding: "async" as const,
  };
}
