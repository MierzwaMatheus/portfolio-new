import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkout, PaymentMethod, InstallmentOption } from "@/types/checkout";
import { Check, CreditCard, QrCode, FileText, AlertCircle, Loader2, Copy } from "lucide-react";

export default function CheckoutPage() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pixData, setPixData] = useState<any>(null);

  useEffect(() => {
    if (uniqueLink) {
      fetchCheckout();
    }
  }, [uniqueLink]);

  const fetchCheckout = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .schema('app_portfolio')
        .from('checkouts')
        .select('*')
        .eq('unique_link', uniqueLink)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast.error('Checkout não encontrado');
        return;
      }

      setCheckout(data as Checkout);

      if (data.status === 'completed') {
        toast.success('Pagamento já realizado!');
      } else if (data.status === 'expired') {
        toast.error('Este checkout expirou');
      }
    } catch (error) {
      console.error('Error fetching checkout:', error);
      toast.error('Erro ao carregar checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const calculateInstallments = (value: number): InstallmentOption[] => {
    const options: InstallmentOption[] = [];
    
    for (let i = 1; i <= 12; i++) {
      let interestRate = 0;
      let interestAmount = 0;
      let totalValue = value;
      let installmentValue = value / i;

      if (i >= 4 && i <= 6) {
        interestRate = 3.49;
        interestAmount = (value * (interestRate / 100)) + 0.49;
        totalValue = value + interestAmount;
        installmentValue = totalValue / i;
      } else if (i >= 7 && i <= 12) {
        interestRate = 3.99;
        interestAmount = (value * (interestRate / 100)) + 0.49;
        totalValue = value + interestAmount;
        installmentValue = totalValue / i;
      }

      options.push({
        count: i,
        value: installmentValue,
        totalValue,
        interestRate: i > 3 ? interestRate : undefined,
        interestAmount: i > 3 ? interestAmount : undefined,
        isInterestFree: i <= 3,
      });
    }

    return options;
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === 'credit_card') {
      setSelectedInstallment(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkout || !selectedPaymentMethod) return;

    setIsProcessing(true);
    try {
      const updateData: any = {
        status: 'payment_selected',
        payment_method: selectedPaymentMethod,
      };

      if (selectedPaymentMethod === 'credit_card' && selectedInstallment) {
        updateData.installment_count = selectedInstallment.count;
        updateData.installment_value = selectedInstallment.value;
        updateData.installment_interest_rate = selectedInstallment.interestRate || 0;
        updateData.installment_interest_amount = selectedInstallment.interestAmount || 0;
        updateData.total_value = selectedInstallment.totalValue;
      }

      const { error } = await supabase
        .schema('app_portfolio')
        .from('checkouts')
        .update(updateData)
        .eq('id', checkout.id);

      if (error) throw error;

      toast.success('Método de pagamento confirmado!');
      setShowConfirmDialog(false);
      
      if (checkout) {
        setCheckout({ ...checkout, ...updateData });
      }

      // Se for PIX, criar pagamento no Asaas
      if (selectedPaymentMethod === 'pix') {
        await createPixPayment();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const createPixPayment = async () => {
    if (!checkout) return;

    try {
      const { data, error } = await supabase.functions.invoke('payment-api', {
        body: { action: 'create_pix_payment', checkout_id: checkout.id }
      });

      if (error) throw error;

      setPixData(data.pix);
      
      // Atualizar checkout com dados do PIX
      await fetchCheckout();
    } catch (error: any) {
      console.error('Error creating PIX payment:', error);
      toast.error(error.message || 'Erro ao criar pagamento PIX');
    }
  };

  const installmentOptions = checkout ? calculateInstallments(checkout.value) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-neon-purple" />
          <p className="text-gray-400">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-white/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-white mb-2">Checkout não encontrado</h2>
            <p className="text-gray-400">O link de checkout é inválido ou expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkout.status === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-white/10">
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Pagamento Realizado!</h2>
            <p className="text-gray-400 mb-4">Obrigado pelo pagamento.</p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400">Valor pago</p>
              <p className="text-2xl font-bold text-neon-purple">{formatCurrency(checkout.value)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkout.status === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-white/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-white mb-2">Checkout Expirado</h2>
            <p className="text-gray-400">Este link de checkout expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Checkout</h1>
            <p className="text-gray-400">Confirme seus dados e escolha o método de pagamento</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Nome</p>
                    <p className="text-white font-medium">{checkout.customer_name}</p>
                  </div>
                  {checkout.customer_email && (
                    <div>
                      <p className="text-sm text-gray-400">E-mail</p>
                      <p className="text-white font-medium">{checkout.customer_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">CPF/CNPJ</p>
                    <p className="text-white font-medium">{formatCpfCnpj(checkout.customer_cpf_cnpj)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Celular</p>
                    <p className="text-white font-medium">{formatPhone(checkout.customer_mobile_phone)}</p>
                  </div>
                  {checkout.customer_company && (
                    <div>
                      <p className="text-sm text-gray-400">Empresa</p>
                      <p className="text-white font-medium">{checkout.customer_company}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Detalhes do Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {checkout.description && (
                    <div>
                      <p className="text-sm text-gray-400">Descrição</p>
                      <p className="text-white font-medium">{checkout.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Valor</p>
                    <p className="text-2xl font-bold text-neon-purple">{formatCurrency(checkout.value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Data de Vencimento</p>
                    <p className="text-white font-medium">
                      {new Date(checkout.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => handlePaymentMethodSelect('pix')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPaymentMethod === 'pix'
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className={`w-6 h-6 ${selectedPaymentMethod === 'pix' ? 'text-neon-purple' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="text-white font-medium">PIX</p>
                        <p className="text-sm text-gray-400">Pagamento instantâneo via QR Code</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodSelect('boleto')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPaymentMethod === 'boleto'
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-6 h-6 ${selectedPaymentMethod === 'boleto' ? 'text-neon-purple' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="text-white font-medium">Boleto</p>
                        <p className="text-sm text-gray-400">Pagamento em até 3 dias úteis</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePaymentMethodSelect('credit_card')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPaymentMethod === 'credit_card'
                        ? 'border-neon-purple bg-neon-purple/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={`w-6 h-6 ${selectedPaymentMethod === 'credit_card' ? 'text-neon-purple' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className="text-white font-medium">Cartão de Crédito</p>
                        <p className="text-sm text-gray-400">Parcele em até 12x</p>
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>

              {selectedPaymentMethod === 'credit_card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="bg-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Parcelamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {installmentOptions.map((option) => (
                          <button
                            key={option.count}
                            onClick={() => setSelectedInstallment(option)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              selectedInstallment?.count === option.count
                                ? 'border-neon-purple bg-neon-purple/10'
                                : 'border-white/10 hover:border-white/20 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">
                                  {option.count}x de {formatCurrency(option.value)}
                                </p>
                                {option.isInterestFree ? (
                                  <Badge variant="outline" className="border-green-500/50 text-green-400 mt-1">
                                    Sem juros
                                  </Badge>
                                ) : (
                                  <p className="text-sm text-gray-400 mt-1">
                                    Total: {formatCurrency(option.totalValue)}
                                    <span className="text-red-400 ml-2">
                                      (+{option.interestRate}% + R$ 0,49)
                                    </span>
                                  </p>
                                )}
                              </div>
                              {selectedInstallment?.count === option.count && (
                                <Check className="w-5 h-5 text-neon-purple" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {selectedPaymentMethod && (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={selectedPaymentMethod === 'credit_card' && !selectedInstallment}
                  className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white font-medium py-6 text-lg"
                >
                  Continuar para Pagamento
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {pixData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center">QR Code PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                {pixData.encodedImage && (
                  <img 
                    src={`data:image/png;base64,${pixData.encodedImage}`} 
                    alt="QR Code PIX" 
                    className="w-full h-auto"
                  />
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Pix Copia e Cola:</p>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white break-all font-mono">
                    {pixData.payload}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.payload);
                    toast.success("Código PIX copiado!");
                  }}
                  className="w-full mt-2 bg-neon-purple hover:bg-neon-purple/90"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </div>

              {pixData.expirationDate && (
                <p className="text-sm text-gray-400 text-center">
                  Expira em: {new Date(pixData.expirationDate).toLocaleString('pt-BR')}
                </p>
              )}

              <Button
                onClick={() => setPixData(null)}
                variant="outline"
                className="w-full border-white/10"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Confirmar Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPaymentMethod === 'pix' && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 mb-2">Método selecionado:</p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-neon-purple" />
                    PIX
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    O QR Code PIX será gerado após a confirmação.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'boleto' && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 mb-2">Método selecionado:</p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5 text-neon-purple" />
                    Boleto
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    O boleto será gerado após a confirmação.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'credit_card' && selectedInstallment && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 mb-2">Método selecionado:</p>
                  <p className="text-white font-medium flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-neon-purple" />
                    Cartão de Crédito
                  </p>
                  <p className="text-neon-purple font-bold text-lg">
                    {selectedInstallment.count}x de {formatCurrency(selectedInstallment.value)}
                  </p>
                  {!selectedInstallment.isInterestFree && (
                    <p className="text-sm text-gray-400 mt-1">
                      Total: {formatCurrency(selectedInstallment.totalValue)}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 mb-1">Valor a pagar:</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {formatCurrency(
                    selectedPaymentMethod === 'credit_card' && selectedInstallment
                      ? selectedInstallment.totalValue
                      : checkout.value
                  )}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isProcessing}
                  className="flex-1 border-white/10"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="flex-1 bg-neon-purple hover:bg-neon-purple/90"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
