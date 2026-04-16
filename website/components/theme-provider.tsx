"use client"

import * as React from "react"
import { venv } from "@/config/env"

// Helper function to convert hex to oklch-like values for CSS variables
// For simplicity, we'll set the CSS custom properties directly with hex values
// and update the globals.css to support both formats
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement

    // Convert sidebar color to HSL for CSS variables
    const sidebarRgb = hexToRgb(venv.SIDEBAR_COLOR)
    if (sidebarRgb) {
      const sidebarHsl = rgbToHsl(sidebarRgb.r, sidebarRgb.g, sidebarRgb.b)
      // Set sidebar background color
      root.style.setProperty("--sidebar", `${sidebarHsl.h} ${sidebarHsl.s}% ${sidebarHsl.l}%`)
      // Set sidebar primary color (slightly lighter)
      root.style.setProperty("--sidebar-primary", `${sidebarHsl.h} ${sidebarHsl.s}% ${Math.min(sidebarHsl.l + 10, 95)}%`)
      // Set sidebar accent color (lighter variant)
      root.style.setProperty("--sidebar-accent", `${sidebarHsl.h} ${sidebarHsl.s}% ${Math.min(sidebarHsl.l + 15, 95)}%`)
    }

    // Convert text color to HSL
    const textRgb = hexToRgb(venv.SIDEBAR_TEXT_COLOR)
    if (textRgb) {
      const textHsl = rgbToHsl(textRgb.r, textRgb.g, textRgb.b)
      root.style.setProperty("--sidebar-foreground", `${textHsl.h} ${textHsl.s}% ${textHsl.l}%`)
      root.style.setProperty("--sidebar-primary-foreground", `${textHsl.h} ${textHsl.s}% ${textHsl.l}%`)
      root.style.setProperty("--sidebar-accent-foreground", `${textHsl.h} ${textHsl.s}% ${textHsl.l}%`)
    }

    // Convert border color to HSL
    const borderRgb = hexToRgb(venv.SIDEBAR_BORDER_COLOR)
    if (borderRgb) {
      const borderHsl = rgbToHsl(borderRgb.r, borderRgb.g, borderRgb.b)
      root.style.setProperty("--sidebar-border", `${borderHsl.h} ${borderHsl.s}% ${borderHsl.l}%`)
    }

    // Set sidebar ring color (use sidebar color with reduced opacity)
    if (sidebarRgb) {
      const ringHsl = rgbToHsl(sidebarRgb.r, sidebarRgb.g, sidebarRgb.b)
      root.style.setProperty("--sidebar-ring", `${ringHsl.h} ${ringHsl.s}% ${ringHsl.l}%`)
    }
  }, [])

  return <>{children}</>
}
