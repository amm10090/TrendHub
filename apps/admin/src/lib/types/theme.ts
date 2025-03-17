export type ColorMode = "light" | "dark" | "system";
export type ContentWidth = "boxed" | "full";
export type NavigationStyle = "sidebar" | "horizontal";
export type FontSize = "sm" | "base" | "lg";
export type FontFamily = "inter" | "roboto" | "poppins" | "openSans";
export type PrimaryColor =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "red"
  | "pink";

export interface ThemeSettings {
  colorMode: ColorMode;
  primaryColor: PrimaryColor;
  contentWidth: ContentWidth;
  navigationStyle: NavigationStyle;
  fontSize: FontSize;
  fontFamily: FontFamily;
  reducedMotion: boolean;
  denseMode: boolean;
}

export interface ThemeContextType extends ThemeSettings {
  setTheme: (settings: Partial<ThemeSettings>) => Promise<void>;
  isLoading: boolean;
}
