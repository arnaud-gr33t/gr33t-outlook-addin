/**
 * Génère les icônes Teams requises par le manifest M365 unifié :
 * - color.png  : 192×192, icône pleine couleur (upscaled depuis icon-80.png)
 * - outline.png : 32×32, silhouette blanche sur fond transparent
 *
 * Usage : npx tsx scripts/make-teams-icons.ts
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const ADDIN_DIR = path.resolve(__dirname, "..");
const SOURCE = path.join(ADDIN_DIR, "assets", "icon-80.png");
const OUT_DIR = path.join(ADDIN_DIR, "teams-manifest");
const COLOR_OUT = path.join(OUT_DIR, "color.png");
const OUTLINE_OUT = path.join(OUT_DIR, "outline.png");

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source icon not found: ${SOURCE}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Color icon 192x192 : upscale from 80 via kernel nearest/lanczos
  await sharp(SOURCE)
    .resize(192, 192, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(COLOR_OUT);
  console.log(`✓ ${COLOR_OUT}`);

  // Outline icon 32x32 : binarize the alpha channel to produce a white silhouette
  // on transparent background. We:
  // 1. resize to 32x32
  // 2. ensure alpha channel
  // 3. replace RGB with pure white where alpha > threshold, transparent otherwise
  const resized = await sharp(SOURCE)
    .resize(32, 32, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error("Expected RGBA output");
  }
  const out = Buffer.alloc(data.length);
  const ALPHA_THRESHOLD = 64;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > ALPHA_THRESHOLD) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
    } else {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
    }
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(OUTLINE_OUT);
  console.log(`✓ ${OUTLINE_OUT}`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
