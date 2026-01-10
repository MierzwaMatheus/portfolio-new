import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Trash2, Users, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";
import { HttpAsaasApi } from "@/services/asaas/HttpAsaasApi";
import { CreateCustomerUseCase } from "@/usecases/asaas/CreateCustomerUseCase";
import { ListCustomersUseCase } from "@/usecases/asaas/ListCustomersUseCase";
import { Customer, CreateCustomerInput } from "@/types/asaas";

export default function PaymentLinks() {
  const asaasApi = new HttpAsaasApi();
  const createCustomerUseCase = new CreateCustomerUseCase(asaasApi);
  const listCustomersUseCase = new ListCustomersUseCase(asaasApi);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: "",
    cpfCnpj: "",
    mobilePhone: "",
    company: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await listCustomersUseCase.execute(100);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      await createCustomerUseCase.execute(customerForm);
      toast.success("Cliente criado com sucesso!");
      setIsCustomerDialogOpen(false);
      setCustomerForm({
        name: "",
        cpfCnpj: "",
        mobilePhone: "",
        company: "",
        email: "",
        phone: "",
      });
      await fetchCustomers();
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Erro ao criar cliente");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      await asaasApi.deleteCustomer(customerId);
      toast.success("Cliente excluído com sucesso!");
      await fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Erro ao excluir cliente");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const formatCpfCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
            <p className="text-gray-400 mt-2">Gerencie clientes, cobranças e notas fiscais via Asaas</p>
          </div>
        </header>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="customers" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="charges" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <FileText className="w-4 h-4 mr-2" />
              Cobranças
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <Receipt className="w-4 h-4 mr-2" />
              Nota Fiscal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Gerencie os clientes cadastrados no Asaas</CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsCustomerDialogOpen(true)}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cliente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum cliente cadastrado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-white">
                              {customer.name}
                            </span>
                            {customer.company && (
                              <Badge variant="outline" className="border-white/20">
                                {customer.company}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-white/20">
                              {customer.personType === 'FISICA' ? 'PF' : 'PJ'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {customer.cpfCnpj && (
                              <span>CPF/CNPJ: {formatCpfCnpj(customer.cpfCnpj)}</span>
                            )}
                            {customer.mobilePhone && (
                              <span>Celular: {formatPhone(customer.mobilePhone)}</span>
                            )}
                            {customer.email && (
                              <span>Email: {customer.email}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(customer.id)}
                            title="Copiar ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charges" className="mt-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Cobranças</CardTitle>
                <CardDescription>Gerencie as cobranças criadas no Asaas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de cobranças em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Nota Fiscal</CardTitle>
                <CardDescription>Gerencie as notas fiscais emitidas no Asaas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de nota fiscal em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="bg-card border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente no Asaas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="customer-name">Nome Completo *</Label>
                <Input
                  id="customer-name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Ex: Matheus Mierzwa"
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-cpf-cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="customer-cpf-cnpj"
                    value={customerForm.cpfCnpj}
                    onChange={(e) => setCustomerForm({ ...customerForm, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-mobile-phone">Celular *</Label>
                  <Input
                    id="customer-mobile-phone"
                    value={customerForm.mobilePhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobilePhone: e.target.value })}
                    placeholder="(11) 98823-2537"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-company">Empresa</Label>
                  <Input
                    id="customer-company"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customer-phone">Telefone Fixo</Label>
                <Input
                  id="customer-phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="(11) 3333-4444"
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomerDialogOpen(false)}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCustomer}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

