import { useEffect } from "react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export function ThemeApplier() {
  const { theme_primary, theme_accent } = useSiteConfig();

  useEffect(() => {
    if (theme_primary) {
      document.documentElement.style.setProperty("--primary", theme_primary);
    }
    if (theme_accent) {
      document.documentElement.style.setProperty("--accent", theme_accent);
    }
  }, [theme_primary, theme_accent]);

  return null;
}
