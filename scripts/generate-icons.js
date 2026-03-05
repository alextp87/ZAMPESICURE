const sharp = require("sharp")
const { existsSync, mkdirSync, readFileSync } = require("fs")

async function main() {
  const projectDir = "/vercel/share/v0-project"
  const inputPath = `${projectDir}/public/icons/icon-512x512.png`

  if (!existsSync(inputPath)) {
    throw new Error("icon-512x512.png not found at: " + inputPath)
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384]
  const outputDir = `${projectDir}/public/icons`

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  for (const size of sizes) {
    const outputPath = `${outputDir}/icon-${size}x${size}.png`
    await sharp(inputPath)
      .resize(size, size, { fit: "cover", background: { r: 234, g: 88, b: 12, alpha: 1 } })
      .png()
      .toFile(outputPath)
    console.log(`Generated: icon-${size}x${size}.png`)
  }

  // OG image 1200x630
  const ogPath = `${projectDir}/public/og-image.jpg`
  await sharp(inputPath)
    .resize(630, 630, { fit: "contain", background: { r: 234, g: 88, b: 12, alpha: 1 } })
    .extend({ top: 0, bottom: 0, left: 285, right: 285, background: { r: 234, g: 88, b: 12, alpha: 1 } })
    .jpeg({ quality: 90 })
    .toFile(ogPath)
  console.log("Generated: og-image.jpg")

  console.log("All PWA assets generated.")
}

main().catch(console.error)
