import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - accept any non-empty credentials
    if (email && password) {
      login();
    } else {
      setError("Por favor, preencha todos os campos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 via-black to-black z-0"></div>
      
      <Card className="w-full max-w-md z-10 border-white/10 bg-black/50 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-neon-purple/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-neon-purple" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Área Administrativa</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-neon-purple/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-neon-purple/50"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white">
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
