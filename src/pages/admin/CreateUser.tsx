import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminLayout } from "./Dashboard";
import { supabase } from "@/lib/supabase";
import { Loader2, UserPlus } from "lucide-react";

const formSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
    role: z.enum(["root", "admin", "proposal-editor"]),
});

export default function CreateUser() {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            role: "proposal-editor",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: values,
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success(`Usuário ${values.email} criado com sucesso com a função ${values.role}`);

            form.reset();
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-lg bg-neon-purple/10 text-neon-purple">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Criar Usuário</h1>
                    </div>
                    <p className="text-gray-400">
                        Adicione novos usuários ao sistema e defina suas permissões de acesso.
                    </p>
                </header>

                <div className="bg-card border border-white/10 rounded-xl p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do usuário" {...field} className="bg-background/50 border-white/10 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@exemplo.com" {...field} className="bg-background/50 border-white/10 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Senha</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} className="bg-background/50 border-white/10 text-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Função (Role)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-white/10 text-white">
                                                    <SelectValue placeholder="Selecione uma função" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="root">Root (Acesso Total)</SelectItem>
                                                <SelectItem value="admin">Admin (Acesso Admin, exceto usuários)</SelectItem>
                                                <SelectItem value="proposal-editor">Editor de Propostas (Apenas Propostas)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    "Criar Usuário"
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </AdminLayout>
    );
}
