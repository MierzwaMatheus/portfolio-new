import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSiteConfig() {
  const config = useSiteConfig();

  if (config.isLoading) {
    return (
      <div className="p-6 text-white/60">Carregando configurações...</div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Site & Aparência</h1>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60 text-sm">Em breve: cor de destaque, fontes e border radius.</p>
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
