import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

const FONT_SANS_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Chakra Petch", label: "Chakra Petch" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "DM Sans", label: "DM Sans" },
];

const FONT_MONO_OPTIONS = [
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Space Mono", label: "Space Mono" },
  { value: "IBM Plex Mono", label: "IBM Plex Mono" },
];

const RADIUS_OPTIONS = [
  { value: "0rem", label: "Nenhum" },
  { value: "0.375rem", label: "Suave" },
  { value: "0.5rem", label: "Médio" },
  { value: "0.75rem", label: "Arredondado" },
  { value: "1rem", label: "Pill" },
];

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
  const [fontSans, setFontSans] = useState(config.theme_font_sans || "Inter");
  const [fontMono, setFontMono] = useState(config.theme_font_mono || "JetBrains Mono");
  const [radius, setRadius] = useState(config.theme_radius || "0.5rem");
  const [siteTitle, setSiteTitle] = useState(config.site_title || "");
  const [siteDescription, setSiteDescription] = useState(config.site_description || "");
  const [twitterHandle, setTwitterHandle] = useState(config.twitter_handle || "");
  const [seoHomeTitle, setSeoHomeTitle] = useState(config.seo_home_title || "");
  const [seoHomeDescription, setSeoHomeDescription] = useState(config.seo_home_description || "");
  const [keywords, setKeywords] = useState<string[]>(config.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState(config.og_image_url || "");
  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const ogFileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const setOgImageMutation = useMutation(api.siteConfig.setOgImage);
  const setBatch = useMutation(api.siteConfig.setBatch);

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

          <div className="space-y-2">
            <Label className="text-white">Fonte principal</Label>
            <Select value={fontSans} onValueChange={setFontSans}>
              <SelectTrigger data-testid="select-font-sans" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SANS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Fonte mono</Label>
            <Select value={fontMono} onValueChange={setFontMono}>
              <SelectTrigger data-testid="select-font-mono" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_MONO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Border radius</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger data-testid="select-radius" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">SEO & Identidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Imagem Open Graph</Label>
            {ogImageUrl && (
              <img src={ogImageUrl} alt="OG Image preview" className="w-40 h-24 object-cover rounded border border-white/10" />
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                data-testid="og-image-upload-button"
                variant="outline"
                size="sm"
                disabled={isUploadingOg}
                onClick={() => ogFileInputRef.current?.click()}
                className="border-white/20 text-white/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingOg ? "Enviando..." : "Fazer upload"}
              </Button>
              <input
                ref={ogFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingOg(true);
                  try {
                    const uploadUrl = await generateUploadUrl({});
                    const result = await fetch(uploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": file.type },
                      body: file,
                    });
                    const { storageId } = await result.json();
                    await setOgImageMutation({ storageId });
                    toast.success("OG Image atualizada com sucesso!");
                  } catch {
                    toast.error("Erro ao fazer upload da OG image.");
                  } finally {
                    setIsUploadingOg(false);
                    if (ogFileInputRef.current) ogFileInputRef.current.value = "";
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Título padrão do site</Label>
            <Input
              data-testid="input-site-title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Descrição padrão</Label>
            <Textarea
              data-testid="textarea-site-description"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Twitter/X handle (sem @)</Label>
            <Input
              data-testid="input-twitter-handle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="usuario"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Keywords</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="flex items-center gap-1">
                  {kw}
                  <button
                    type="button"
                    onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              data-testid="keywords-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && keywordInput.trim()) {
                  e.preventDefault();
                  if (!keywords.includes(keywordInput.trim())) {
                    setKeywords([...keywords, keywordInput.trim()]);
                  }
                  setKeywordInput("");
                }
              }}
              placeholder="Digite e pressione Enter"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Título da página Home (SEO)</Label>
            <Input
              data-testid="input-seo-home-title"
              value={seoHomeTitle}
              onChange={(e) => setSeoHomeTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Descrição da página Home (SEO)</Label>
            <Textarea
              data-testid="textarea-seo-home-description"
              value={seoHomeDescription}
              onChange={(e) => setSeoHomeDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
