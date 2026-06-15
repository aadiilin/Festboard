import { writeFileSync } from "fs"

function svgIcon(size, letter = "F") {
  const fontSize = Math.round(size * 0.6)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2563eb"/><stop offset="100%" style="stop-color:#4f46e5"/></linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">${letter}</text>
  </svg>`
}

// Generate SVGs
writeFileSync("public/icons/icon-192.svg", svgIcon(192))
writeFileSync("public/icons/icon-512.svg", svgIcon(512))
writeFileSync("public/icons/icon-192x192.svg", svgIcon(192))
writeFileSync("public/icons/icon-512x512.svg", svgIcon(512))
writeFileSync("public/icons/apple-touch-icon.svg", svgIcon(180, "FB"))
writeFileSync("public/favicon.svg", svgIcon(48, "F"))

console.log("SVG icons generated.")

// Try generating PNGs if sharp is available
try {
  const sharp = (await import("sharp")).default
  const sizes = [
    { name: "icon-192x192.png", size: 192 },
    { name: "icon-512x512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ]
  for (const { name, size } of sizes) {
    const svg = svgIcon(size, name.includes("apple") ? "FB" : "F")
    const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
    writeFileSync(`public/icons/${name}`, png)
    console.log(`Generated ${name}`)
  }
} catch {
  console.log("sharp not available, skipping PNG generation. SVGs will be used as fallback.")
}
