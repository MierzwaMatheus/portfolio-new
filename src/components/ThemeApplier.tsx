import { useEffect } from "react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export function ThemeApplier() {
  const { theme_primary, theme_accent, theme_background, theme_foreground } = useSiteConfig();

  useEffect(() => {
    const el = document.documentElement;
    if (theme_primary) el.style.setProperty("--primary", theme_primary);
    if (theme_accent) el.style.setProperty("--accent", theme_accent);
    if (theme_background) el.style.setProperty("--bg", theme_background);
    if (theme_foreground) el.style.setProperty("--text", theme_foreground);
  }, [theme_primary, theme_accent, theme_background, theme_foreground]);

  return null;
}
