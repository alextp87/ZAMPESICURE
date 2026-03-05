const sharp = require("sharp")
const { existsSync, mkdirSync, readFileSync, readdirSync } = require("fs")

async function main() {
  // Find logo.png - try multiple possible paths
  const possiblePaths = [
    "/home/user/public/logo.png",
    `${process.cwd()}/public/logo.png`,
    "./public/logo.png",
  ]
  
  let inputPath = null
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      inputPath = p
      console.log(`Found logo at: ${p}`)
      break
    }
  }

  if (!inputPath) {
    console.log("CWD:", process.cwd())
    console.log("Files in CWD:", readdirSync(process.cwd()).join(", "))
    throw new Error("logo.png not found in any expected path")
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
  const outputDir = "/tmp/pwa-icons"

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  for (const size of sizes) {
    const outputPath = `${outputDir}/icon-${size}x${size}.png`
    await sharp(inputPath)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath)
    const b64 = readFileSync(outputPath).toString("base64")
    console.log(`ICON_${size}:${b64}`)
  }

  // OG image 1200x630
  const ogPath = `${outputDir}/og-image.jpg`
  await sharp(inputPath)
    .resize(630, 630, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({ top: 0, bottom: 0, left: 285, right: 285, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 90 })
    .toFile(ogPath)
  const ogB64 = readFileSync(ogPath).toString("base64")
  console.log(`OG_IMAGE:${ogB64}`)

  console.log("DONE")
}

main().catch(console.error)
