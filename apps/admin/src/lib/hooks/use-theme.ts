import { useContext } from "react";

import { ThemeContext } from "@/lib/providers/theme-provider";
import { ThemeContextType } from "@/lib/types/theme";

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
