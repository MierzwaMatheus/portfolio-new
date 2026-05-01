import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

export default function AdminContact() {
  const data = useQuery(api.contactInfo.get, {});
  const updateContactInfo = useMutation(api.contactInfo.update);
  const loading = data === undefined;

  const [personalData, setPersonalData] = useState({
    name: "",
    role: "",
    email: "",
    showEmail: true,
    phone: "",
    showPhone: true,
    birthDate: "",
    showBirthDate: false,
    location: "",
    showLocation: false,
    avatarUrl: ""
  });

  const [socialMedia, setSocialMedia] = useState({
    linkedin: "",
    github: "",
    behance: ""
  });

  useEffect(() => {
    if (data) {
      const rolePT = data.roleTranslations?.ptBR || data.role || "";
      setPersonalData({
        name: data.name || "",
        role: rolePT,
        email: data.email || "",
        showEmail: data.showEmail ?? true,
        phone: data.phone || "",
        showPhone: data.showPhone ?? true,
        birthDate: data.birthDate || "",
        showBirthDate: data.showBirthDate ?? false,
        location: data.location || "",
        showLocation: data.showLocation ?? false,
        avatarUrl: data.avatarUrl || ""
      });
      setSocialMedia({
        linkedin: data.linkedinUrl || "",
        github: data.githubUrl || "",
        behance: data.behanceUrl || ""
      });
    }
  }, [data]);

  const handlePersonalChange = (field: string, value: any) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setSocialMedia(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const rolePT = personalData.role || '';
      await updateContactInfo({
        name: personalData.name,
        role: rolePT,
        ...(rolePT
          ? { roleTranslations: { ptBR: rolePT, enUS: rolePT } }
          : {}),
        email: personalData.email,
        showEmail: personalData.showEmail,
        phone: personalData.phone,
        showPhone: personalData.showPhone,
        birthDate: personalData.birthDate || undefined,
        showBirthDate: personalData.showBirthDate,
        location: personalData.location,
        showLocation: personalData.showLocation,
        avatarUrl: personalData.avatarUrl,
        linkedinUrl: socialMedia.linkedin,
        githubUrl: socialMedia.github,
        behanceUrl: socialMedia.behance,
      });
      toast.success("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Informações de Contato</h1>
        </div>

        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Nome Completo*</Label>
                <Input
                  value={personalData.name}
                  onChange={(e) => handlePersonalChange("name", e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Imagem de Perfil</Label>
                <div className="flex items-center gap-4">
                  {personalData.avatarUrl && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                      <img src={personalData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <ImagePicker
                      onSelect={(url) => handlePersonalChange("avatarUrl", Array.isArray(url) ? url[0] : url)}
                      trigger={
                        <Button type="button" variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {personalData.avatarUrl ? "Alterar Imagem" : "Selecionar Imagem"}
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Título Profissional</Label>
              <Input
                value={personalData.role}
                onChange={(e) => handlePersonalChange("role", e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.email}
                    onChange={(e) => handlePersonalChange("email", e.target.value)}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showEmail}
                      onCheckedChange={(checked) => handlePersonalChange("showEmail", checked)}
                    />
                    <span className="text-sm text-gray-400">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">WhatsApp</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.phone}
                    onChange={(e) => handlePersonalChange("phone", e.target.value)}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showPhone}
                      onCheckedChange={(checked) => handlePersonalChange("showPhone", checked)}
                    />
                    <span className="text-sm text-gray-400">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Data de Nascimento</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={personalData.birthDate}
                    onChange={(e) => handlePersonalChange("birthDate", e.target.value)}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showBirthDate}
                      onCheckedChange={(checked) => handlePersonalChange("showBirthDate", checked)}
                    />
                    <span className="text-sm text-gray-400">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Localização</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.location}
                    onChange={(e) => handlePersonalChange("location", e.target.value)}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showLocation}
                      onCheckedChange={(checked) => handlePersonalChange("showLocation", checked)}
                    />
                    <span className="text-sm text-gray-400">Mostrar</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">LinkedIn</Label>
              <Input
                value={socialMedia.linkedin}
                onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">GitHub</Label>
              <Input
                value={socialMedia.github}
                onChange={(e) => handleSocialChange("github", e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Behance</Label>
              <Input
                value={socialMedia.behance}
                onChange={(e) => handleSocialChange("behance", e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-neon-purple hover:bg-neon-purple/90 text-white px-8">
            Salvar Alterações
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
