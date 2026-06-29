interface AvatarOptions {
  /** Dimensions of the generated image (px) */
  size?: number
  /** Image quality (0-1), default 0.9 (JPEG) */
  quality?: number
}

/**
 * Generate a design-grade soft light avatar
 * @param options Configuration Item
 * @returns Promise<Blob> - The binary object of the image, which can be used directly to upload or generate a preview link.
 */
export function generateAvatarBlob(options: AvatarOptions = {}): Promise<Blob> {
  const { size = 180, quality = 0.9 } = options

  return new Promise((resolve, reject) => {
    try {
      // Create Canvas in memory
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context creation failed'))
        return
      }

      // Determine the Main Hue
      let mainHue = Math.floor(Math.random() * 360)
      // Avoid 50 - 80 (yellow-green/earth color)
      if (mainHue >= 50 && mainHue <= 80) {
        mainHue = Math.random() > 0.5 ? 40 : 140
      }

      // Draw a solid background (to prevent edge whitening)
      // Fill the background with a very light version of the primary color.
      ctx.fillStyle = `hsla(${mainHue}, 70%, 96%, 1)`
      ctx.fillRect(0, 0, size, size)

      // Enable Gaussian Blur (Soften Highlights)
      // Calculate the blur radius dynamically according to the size. size -> 60px
      const blurRadius = Math.round(size * 0.2)
      ctx.filter = `blur(${blurRadius}px)`

      // Draw 3-5 random light spots
      const orbCount = 3 + Math.floor(Math.random() * 3)

      for (let i = 0; i < orbCount; i++) {
        // Adjacent Color Logic: Within a range of ±60 degrees from the primary color tone
        const angleSpread = 60
        let hue = mainHue + (Math.random() * angleSpread * 2 - angleSpread)

        // Hue Ring Correction
        if (hue < 0)
          hue += 360
        if (hue > 360)
          hue -= 360

        // Brightness/Saturation Intelligent Correction
        let s = 80 + Math.random() * 20 // High saturation
        let l = 65 + Math.random() * 15 // High Brightness

        // Visual correction for specific colors
        if (hue > 40 && hue < 80) {
          // If the yellow color system is too bright, it will be invisible. Slightly darken it and max out the saturation.
          l = 60 + Math.random() * 10
          s = 95
        }
        if (hue > 220 && hue < 270) {
          // The blue-purple tone is too dark and can look dirty; slightly brighten it.
          l = 75 + Math.random() * 10
        }

        const color = `hsla(${hue}, ${s}%, ${l}%, 1)`

        const offset = size * 0.2
        const x = -offset + Math.random() * (size + offset * 2)
        const y = -offset + Math.random() * (size + offset * 2)
        const r = (size / 2) * (0.6 + Math.random() * 0.6) // 半径

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.filter = 'none'

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          }
          else {
            reject(new Error('Avatar generation failed'))
          }
        },
        'image/jpeg',
        quality,
      )
    }
    catch (error) {
      reject(error)
    }
  })
}
