// atio brand tokens (matched from the logo and the EchoGrid talk slides).
import { loadFont } from "@remotion/google-fonts/Poppins";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin", "latin-ext"],
});

export const BRAND_FONT = fontFamily;

export const BRAND = {
  navy: "#002850",
  navyDeep: "#001A36",
  navySoft: "#0D3B6E",
  orange: "#FFA000",
  blue: "#2E6DB4",
  light: "#F4F6FA",
  grey: "#8A97AD",
  white: "#FFFFFF",
} as const;

/** Vertical safe zone for 1080x1920 Reels (platform UI covers top/bottom). */
export const SAFE = { top: 250, bottom: 1920 - 420 } as const;
