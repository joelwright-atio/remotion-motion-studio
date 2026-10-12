// Google Fonts loaded via @remotion/google-fonts so they are ready before a
// frame renders. https://www.remotion.dev/docs/google-fonts/load-font
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

export const FONT_FAMILY = fontFamily;
