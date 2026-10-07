"use client";

// Content fingerprints for duplicate detection (see migration 0014).
// Must match scripts/backfill-media-hashes.ts.

export async function sha256(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Difference hash: shrink to 9×8 greyscale and record, for each row,
// whether each pixel is brighter than its right-hand neighbour. 64 bits
// that survive resizing and re-compression, as 16 hex digits.
export async function imageHash(file: Blob) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, 9, 8);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, 9, 8);
  const grey = (x: number, y: number) => {
    const i = (y * 9 + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  let hex = "";
  for (let y = 0; y < 8; y++) {
    let byte = 0;
    for (let x = 0; x < 8; x++) byte = (byte << 1) | (grey(x, y) > grey(x + 1, y) ? 1 : 0);
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}
