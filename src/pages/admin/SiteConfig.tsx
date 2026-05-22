import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

export default function AdminSiteConfig() {
  const config = useSiteConfig();
  const [accentColor, setAccentColor] = useState(config.theme_accent_color || "#6366f1");
  const [hexInput, setHexInput] = useState(config.theme_accent_color || "#6366f1");

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (isValidHex(value)) {
      setAccentColor(value);
    }
  };

  const handleNativeColorChange = (value: string) => {
    setAccentColor(value);
    setHexInput(value);
  };

  const hsl = hexToHsl(accentColor);

  if (config.isLoading) {
    return <div className="p-6 text-white/60">Carregando configurações...</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Site & Aparência</h1>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-white">Cor de destaque</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                data-testid="color-picker-native"
                value={accentColor}
                onChange={(e) => handleNativeColorChange(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                data-testid="color-picker-hex"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#6366f1"
                className="bg-white/5 border-white/10 text-white w-36"
                maxLength={7}
              />
              {!isValidHex(hexInput) && hexInput !== "" && (
                <span className="text-red-400 text-sm">Formato inválido. Use #rrggbb</span>
              )}
            </div>
            {hsl && (
              <div data-testid="color-preview" className="flex items-center gap-3 mt-2">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="space-x-4 text-white/60 text-sm">
                  <span>H: {hsl.h}°</span>
                  <span>S: {hsl.s}%</span>
                  <span>L: {hsl.l}%</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">SEO & Identidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60 text-sm">Em breve: título, descrição, OG image e mais.</p>
        </CardContent>
      </Card>
    </div>
  );
}
