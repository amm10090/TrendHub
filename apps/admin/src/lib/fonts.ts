import { Inter, Roboto_Mono, Poppins, Open_Sans } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
});

export const roboto = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  preload: true,
  adjustFontFallback: true,
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  preload: true,
  adjustFontFallback: true,
});

export const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  preload: true,
  adjustFontFallback: true,
});
