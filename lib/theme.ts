/**
 * Fanzluv Design Tokens - Purple/Pink Gradient Theme
 * Add this to your global CSS or tailwind.config.ts
 *
 * Background:   #0d0d1a  (deep navy-black)
 * Surface:      #13112b  (dark purple-navy)
 * Card:         #1a1635  (slightly lighter purple)
 * Card hover:   #201c3e
 * Primary:      #ef3976  (hot pink - keeps Fanzluv brand)
 * Secondary:    #7c3aed  (violet purple)
 * Gradient:     linear-gradient(135deg, #7c3aed → #ef3976)
 * Border:       rgba(124,58,237,0.2) default | rgba(239,57,118,0.3) primary
 * Text:         #f0eaff  primary | rgba(240,234,255,0.5) muted
 */

export const theme = {
  bg: {
    base:    "#0d0d1a",
    surface: "#13112b",
    card:    "#1a1635",
    cardHov: "#201c3e",
  },
  color: {
    primary:   "#ef3976",
    secondary: "#7c3aed",
    gradient:  "linear-gradient(135deg, #7c3aed 0%, #ef3976 100%)",
    gradientR: "linear-gradient(135deg, #ef3976 0%, #7c3aed 100%)",
    gold:      "#fbbf24",
    silver:    "#a0a0c0",
    bronze:    "#cd7f32",
  },
  border: {
    subtle:  "rgba(124,58,237,0.15)",
    default: "rgba(124,58,237,0.25)",
    primary: "rgba(239,57,118,0.35)",
    focus:   "rgba(124,58,237,0.6)",
  },
  text: {
    primary: "#f0eaff",
    muted:   "rgba(240,234,255,0.5)",
    dim:     "rgba(240,234,255,0.25)",
  },
} as const;