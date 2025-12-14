import { useState, useEffect } from "react";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AdminLayout } from "./Dashboard";
import { supabase } from "@/lib/supabase";
import { Loader2, UserPlus, Users, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
    role: z.enum(["root", "admin", "proposal-editor"]),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
}

export default function CreateUser() {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            name: "",
            role: "proposal-editor",
        },
    });

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                method: 'GET',
            });

            if (error) throw error;
            if (data?.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Erro ao carregar usuários");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            // If password is empty string, send undefined so the backend handles it (for existing users)
            const payload = {
                ...values,
                password: values.password === "" ? undefined : values.password
            };

            const { data, error } = await supabase.functions.invoke('create-user', {
                body: payload,
                method: 'POST',
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success(data.message || `Operação realizada com sucesso`);

            form.reset();
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = async (userId: string, userEmail: string) => {
        if (!confirm(`Tem certeza que deseja remover o acesso do usuário ${userEmail}?`)) return;

        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: { user_id: userId },
                method: 'DELETE',
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success("Acesso do usuário removido com sucesso");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Erro ao remover usuário");
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-lg bg-neon-purple/10 text-neon-purple">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
                    </div>
                    <p className="text-gray-400">
                        Adicione novos usuários ou gerencie o acesso de usuários existentes.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="bg-card border border-white/10 rounded-xl p-6 h-fit">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-neon-purple" />
                            Novo Usuário
                        </h2>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Senha</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="******"
                                                            {...field}
                                                            className="bg-background/50 border-white/10 text-white pr-10"
                                                        />
                                                    </FormControl>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Confirmar Senha</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="******"
                                                        {...field}
                                                        className="bg-background/50 border-white/10 text-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                                    <SelectItem value="admin">Admin (Acesso Admin)</SelectItem>
                                                    <SelectItem value="proposal-editor">Editor de Propostas</SelectItem>
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
                                            Processando...
                                        </>
                                    ) : (
                                        "Salvar Usuário"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div className="bg-card border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-neon-purple" />
                            Usuários Ativos
                        </h2>

                        {isLoadingUsers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
                            </div>
                        ) : (
                            <div className="rounded-md border border-white/10">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-white/5">
                                            <TableHead className="text-gray-400">Nome</TableHead>
                                            <TableHead className="text-gray-400">Função</TableHead>
                                            <TableHead className="text-gray-400">Data</TableHead>
                                            <TableHead className="text-gray-400 w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                                                    Nenhum usuário encontrado
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
                                                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                                    <TableCell className="font-medium text-white">
                                                        <div>{user.name}</div>
                                                        <div className="text-xs text-gray-400">{user.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                                                            {user.role}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-400 text-sm">
                                                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                            onClick={() => handleDelete(user.id, user.email)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
