import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Copy, ExternalLink, Trash2, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
}

interface Price {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
}

interface PaymentLink {
  id: string;
  url: string;
  price: string;
  product: string;
  created: number;
}

export default function PaymentLinks() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Product Dialog
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: ""
  });

  // Price Dialog
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState({
    product: "",
    unit_amount: "",
    currency: "brl",
    recurring: false,
    interval: "month",
    interval_count: "1"
  });

  // Payment Link Dialog
  const [isPaymentLinkDialogOpen, setIsPaymentLinkDialogOpen] = useState(false);
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    price: "",
    quantity: "1",
    enable_installments: false,
    installment_plans: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchPrices(),
        fetchPaymentLinks()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: { action: "list_products" }
      });

      if (error) throw error;
      setProducts(data?.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos");
    }
  };

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: { action: "list_prices" }
      });

      if (error) throw error;
      setPrices(data?.data || []);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Erro ao carregar preços");
    }
  };

  const fetchPaymentLinks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: { action: "list_payment_links" }
      });

      if (error) throw error;
      setPaymentLinks(data?.data || []);
    } catch (error) {
      console.error("Error fetching payment links:", error);
      toast.error("Erro ao carregar links de pagamento");
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: {
          action: "create_product",
          name: productForm.name,
          description: productForm.description || undefined
        }
      });

      if (error) throw error;

      toast.success("Produto criado com sucesso!");
      setIsProductDialogOpen(false);
      setProductForm({ name: "", description: "" });
      await fetchProducts();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Erro ao criar produto");
    }
  };

  const handleCreatePrice = async () => {
    if (!priceForm.product || !priceForm.unit_amount) {
      toast.error("Produto e valor são obrigatórios");
      return;
    }

    try {
      const unitAmount = Math.round(parseFloat(priceForm.unit_amount) * 100); // Converter para centavos

      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: {
          action: "create_price",
          product: priceForm.product,
          unit_amount: unitAmount,
          currency: priceForm.currency,
          recurring: priceForm.recurring ? {
            interval: priceForm.interval,
            interval_count: parseInt(priceForm.interval_count)
          } : undefined
        }
      });

      if (error) throw error;

      toast.success("Preço criado com sucesso!");
      setIsPriceDialogOpen(false);
      setPriceForm({
        product: "",
        unit_amount: "",
        currency: "brl",
        recurring: false,
        interval: "month",
        interval_count: "1"
      });
      await fetchPrices();
    } catch (error: any) {
      console.error("Error creating price:", error);
      toast.error(error.message || "Erro ao criar preço");
    }
  };

  const handleCreatePaymentLink = async () => {
    if (!paymentLinkForm.price) {
      toast.error("Selecione um preço");
      return;
    }

    try {
      const requestBody: any = {
        action: "create_payment_link",
        price: paymentLinkForm.price,
        quantity: parseInt(paymentLinkForm.quantity)
      };

      // Adicionar configurações de parcelamento se habilitado
      if (paymentLinkForm.enable_installments) {
        requestBody.enable_installments = true;
        if (paymentLinkForm.installment_plans.length > 0) {
          requestBody.installment_plans = paymentLinkForm.installment_plans.map(count => ({
            count,
            interval: "month"
          }));
        }
      }

      const { data, error } = await supabase.functions.invoke("stripe-api", {
        body: requestBody
      });

      if (error) throw error;

      toast.success("Link de pagamento criado com sucesso!");
      setIsPaymentLinkDialogOpen(false);
      setPaymentLinkForm({ 
        price: "", 
        quantity: "1",
        enable_installments: false,
        installment_plans: []
      });
      await fetchPaymentLinks();
    } catch (error: any) {
      console.error("Error creating payment link:", error);
      toast.error(error.message || "Erro ao criar link de pagamento");
    }
  };

  const toggleInstallmentPlan = (count: number) => {
    setPaymentLinkForm(prev => {
      const plans = [...prev.installment_plans];
      const index = plans.indexOf(count);
      if (index > -1) {
        plans.splice(index, 1);
      } else {
        plans.push(count);
      }
      return { ...prev, installment_plans: plans.sort((a, b) => a - b) };
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase() === "BRL" ? "BRL" : "USD"
    }).format(amount / 100);
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || productId;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Links de Pagamento</h1>
            <p className="text-gray-400 mt-2">Gerencie produtos, preços e links de pagamento do Stripe</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsProductDialogOpen(true)}
              className="bg-neon-purple hover:bg-neon-purple/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
            <Button
              onClick={() => setIsPriceDialogOpen(true)}
              variant="outline"
              className="border-white/10 hover:bg-white/5"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Novo Preço
            </Button>
            <Button
              onClick={() => setIsPaymentLinkDialogOpen(true)}
              variant="outline"
              className="border-white/10 hover:bg-white/5"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <>
            {/* Payment Links */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Links de Pagamento</CardTitle>
                <CardDescription>Links criados para compartilhamento</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentLinks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum link de pagamento criado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentLinks.map((link) => {
                      const price = prices.find(p => p.id === link.price);
                      return (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">
                                {getProductName(link.product)}
                              </span>
                              {price && (
                                <Badge variant="outline" className="border-white/20">
                                  {formatCurrency(price.unit_amount, price.currency)}
                                  {price.recurring && ` / ${price.recurring.interval}`}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 break-all">{link.url}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(link.url)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(link.url, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
                <CardDescription>Produtos disponíveis no Stripe</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum produto criado ainda
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Package className="w-5 h-5 text-neon-purple" />
                          <Badge variant="outline" className="border-white/20 text-xs">
                            {product.id}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-white mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prices */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Preços</CardTitle>
                <CardDescription>Preços configurados para os produtos</CardDescription>
              </CardHeader>
              <CardContent>
                {prices.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum preço configurado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prices.map((price) => (
                      <div
                        key={price.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">
                              {getProductName(price.product)}
                            </span>
                            <Badge variant="outline" className="border-white/20">
                              {formatCurrency(price.unit_amount, price.currency)}
                            </Badge>
                            {price.recurring && (
                              <Badge variant="outline" className="border-white/20">
                                Recorrente: {price.recurring.interval_count} {price.recurring.interval}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{price.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Product Dialog */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
              <DialogDescription>
                Crie um novo produto no Stripe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Nome do Produto *</Label>
                <Input
                  id="product-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Consultoria Premium"
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="product-description">Descrição</Label>
                <Textarea
                  id="product-description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Descrição do produto..."
                  className="mt-1 bg-white/5 border-white/10"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsProductDialogOpen(false)}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProduct}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Produto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Price Dialog */}
        <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Criar Novo Preço</DialogTitle>
              <DialogDescription>
                Configure um preço para um produto existente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="price-product">Produto *</Label>
                <Select
                  value={priceForm.product}
                  onValueChange={(value) => setPriceForm({ ...priceForm, product: value })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price-amount">Valor *</Label>
                  <Input
                    id="price-amount"
                    type="number"
                    step="0.01"
                    value={priceForm.unit_amount}
                    onChange={(e) => setPriceForm({ ...priceForm, unit_amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="price-currency">Moeda *</Label>
                  <Select
                    value={priceForm.currency}
                    onValueChange={(value) => setPriceForm({ ...priceForm, currency: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brl">BRL (R$)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="price-recurring"
                  checked={priceForm.recurring}
                  onChange={(e) => setPriceForm({ ...priceForm, recurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="price-recurring" className="cursor-pointer">
                  Preço recorrente (assinatura)
                </Label>
              </div>
              {priceForm.recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price-interval">Intervalo</Label>
                    <Select
                      value={priceForm.interval}
                      onValueChange={(value) => setPriceForm({ ...priceForm, interval: value })}
                    >
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Diário</SelectItem>
                        <SelectItem value="week">Semanal</SelectItem>
                        <SelectItem value="month">Mensal</SelectItem>
                        <SelectItem value="year">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price-interval-count">Quantidade de Intervalos</Label>
                    <Input
                      id="price-interval-count"
                      type="number"
                      value={priceForm.interval_count}
                      onChange={(e) => setPriceForm({ ...priceForm, interval_count: e.target.value })}
                      placeholder="1"
                      className="mt-1 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPriceDialogOpen(false)}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePrice}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Preço
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Payment Link Dialog */}
        <Dialog open={isPaymentLinkDialogOpen} onOpenChange={setIsPaymentLinkDialogOpen}>
          <DialogContent className="bg-card border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Link de Pagamento</DialogTitle>
              <DialogDescription>
                Crie um link de pagamento para compartilhar com clientes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-price">Preço *</Label>
                <Select
                  value={paymentLinkForm.price}
                  onValueChange={(value) => setPaymentLinkForm({ ...paymentLinkForm, price: value })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecione um preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {prices.map((price) => {
                      const product = products.find(p => p.id === price.product);
                      return (
                        <SelectItem key={price.id} value={price.id}>
                          {product?.name || price.product} - {formatCurrency(price.unit_amount, price.currency)}
                          {price.recurring && ` / ${price.recurring.interval}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="link-quantity">Quantidade</Label>
                <Input
                  id="link-quantity"
                  type="number"
                  min="1"
                  value={paymentLinkForm.quantity}
                  onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, quantity: e.target.value })}
                  placeholder="1"
                  className="mt-1 bg-white/5 border-white/10"
                />
              </div>

              {/* Opções de Parcelamento */}
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-installments"
                    checked={paymentLinkForm.enable_installments}
                    onChange={(e) => setPaymentLinkForm({ 
                      ...paymentLinkForm, 
                      enable_installments: e.target.checked,
                      installment_plans: e.target.checked ? paymentLinkForm.installment_plans : []
                    })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="enable-installments" className="cursor-pointer font-medium">
                    Permitir pagamento parcelado
                  </Label>
                </div>

                {paymentLinkForm.enable_installments && (
                  <div className="space-y-3 pl-6 border-l-2 border-neon-purple/30">
                    <div>
                      <Label className="text-sm text-gray-400 mb-2 block">
                        Selecione as opções de parcelamento disponíveis:
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => toggleInstallmentPlan(count)}
                            className={cn(
                              "px-3 py-2 rounded-lg border transition-colors text-sm",
                              paymentLinkForm.installment_plans.includes(count)
                                ? "bg-neon-purple/20 border-neon-purple text-neon-purple"
                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                            )}
                          >
                            {count}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                      <p className="font-medium mb-1">ℹ️ Sobre parcelamento:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Para habilitar parcelamento, configure nas <strong>Settings do Stripe Dashboard</strong> → Payment methods → Card installments</li>
                        <li>O Stripe determinará automaticamente se o parcelamento está disponível para o cartão do cliente</li>
                        <li>As taxas de juros são definidas pelo banco emissor do cartão (com ou sem juros conforme o banco)</li>
                        <li>Os planos selecionados aqui são apenas informativos - o Stripe usará as configurações do Dashboard</li>
                        <li>O parcelamento está disponível apenas para cartões de crédito brasileiros</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPaymentLinkDialogOpen(false);
                    setPaymentLinkForm({ 
                      price: "", 
                      quantity: "1",
                      enable_installments: false,
                      installment_plans: []
                    });
                  }}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePaymentLink}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

