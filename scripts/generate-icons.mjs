import sharp from "sharp"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputPath = join(process.cwd(), "public/icons/icon-512x512.png")
const outputDir = join(process.cwd(), "public/icons")

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

for (const size of sizes) {
  const outputPath = join(outputDir, `icon-${size}x${size}.png`)
  await sharp(inputPath)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(outputPath)
  console.log(`Generated: icon-${size}x${size}.png`)
}

// Generate OG image (1200x630) with orange background
await sharp(inputPath)
  .resize(630, 630, { fit: "contain", background: { r: 234, g: 88, b: 12, alpha: 1 } })
  .extend({ top: 0, bottom: 0, left: 285, right: 285, background: { r: 234, g: 88, b: 12, alpha: 1 } })
  .jpeg({ quality: 90 })
  .toFile(join(process.cwd(), "public/og-image.jpg"))
console.log("Generated: og-image.jpg")

console.log("All PWA assets generated.")
