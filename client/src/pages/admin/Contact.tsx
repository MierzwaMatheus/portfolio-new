import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminContact() {
  const [personalData, setPersonalData] = useState({
    name: "Matheus Mierzwa",
    role: "Desenvolvedor Front-End e UI Designer",
    email: "mierzwa.oliveira@gmail.com",
    showEmail: true,
    phone: "+5511988232537",
    showPhone: true,
    birthDate: "1995-05-15",
    showBirthDate: false,
    location: "São Paulo, SP",
    showLocation: false,
    avatarUrl: "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg"
  });

  const [socialMedia, setSocialMedia] = useState({
    linkedin: "https://www.linkedin.com/in/matheus-mierzwa/",
    github: "https://github.com/MierzwaMatheus",
    behance: "https://www.behance.net/mierzwamatheus"
  });

  const handlePersonalChange = (field: string, value: any) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setSocialMedia(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Logic to save would go here
    alert("Alterações salvas com sucesso!");
  };

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
                <Label className="text-white">URL da Imagem de Perfil</Label>
                <Input 
                  value={personalData.avatarUrl}
                  onChange={(e) => handlePersonalChange("avatarUrl", e.target.value)}
                  className="bg-white/5 border-white/10 text-white" 
                />
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
