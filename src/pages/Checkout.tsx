import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkout, PaymentMethod, InstallmentOption } from "@/types/checkout";
import { Check, CreditCard, QrCode, FileText, AlertCircle, Loader2, Copy } from "lucide-react";

export default function CheckoutPage() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const [, navigate] = useLocation();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pixExpiration, setPixExpiration] = useState<Date | null>(null);
  const [boletoData, setBoletoData] = useState<any>(null);

  // Estados para dados do cartão de crédito
  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  });
  const [creditCardHolderInfo, setCreditCardHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
    phone: '',
  });

  // Funções de validação e máscara
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19); // 16 dígitos + 3 espaços
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
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

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const validateCardData = () => {
    const errors: string[] = [];

    // Validação do cartão
    if (!creditCard.holderName.trim()) {
      errors.push('Nome impresso no cartão é obrigatório');
    }

    const cardNumberClean = creditCard.number.replace(/\D/g, '');
    if (cardNumberClean.length !== 16) {
      errors.push('Número do cartão deve ter 16 dígitos');
    }

    if (!creditCard.expiryMonth) {
      errors.push('Mês de validade é obrigatório');
    }

    if (!creditCard.expiryYear) {
      errors.push('Ano de validade é obrigatório');
    }

    if (!creditCard.ccv.trim() || creditCard.ccv.length !== 3) {
      errors.push('CVV deve ter 3 dígitos');
    }

    // Validação do titular
    if (!creditCardHolderInfo.name.trim()) {
      errors.push('Nome completo é obrigatório');
    }

    if (!creditCardHolderInfo.email.trim()) {
      errors.push('E-mail é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creditCardHolderInfo.email)) {
      errors.push('E-mail inválido');
    }

    const cpfCnpjClean = creditCardHolderInfo.cpfCnpj.replace(/\D/g, '');
    if (cpfCnpjClean.length !== 11 && cpfCnpjClean.length !== 14) {
      errors.push('CPF/CNPJ inválido');
    }

    if (!creditCardHolderInfo.postalCode.trim()) {
      errors.push('CEP é obrigatório');
    }

    if (!creditCardHolderInfo.addressNumber.trim()) {
      errors.push('Número do endereço é obrigatório');
    }

    if (!creditCardHolderInfo.phone.trim()) {
      errors.push('Telefone é obrigatório');
    }

    return errors;
  };

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

      // Verificar se o pagamento já foi realizado e redirecionar
      if (data.status === 'paid' || data.status === 'completed') {
        navigate(`/payment-success/${uniqueLink}`);
        return;
      }

      if (data.status === 'expired') {
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
      // Se for cartão de crédito, processar pagamento diretamente
      if (selectedPaymentMethod === 'credit_card') {
        // Validar campos do cartão
        if (!creditCard.holderName || !creditCard.number || !creditCard.expiryMonth || 
            !creditCard.expiryYear || !creditCard.ccv) {
          toast.error('Preencha todos os dados do cartão');
          setIsProcessing(false);
          return;
        }

        if (!creditCardHolderInfo.name || !creditCardHolderInfo.email || !creditCardHolderInfo.cpfCnpj ||
            !creditCardHolderInfo.postalCode || !creditCardHolderInfo.addressNumber || !creditCardHolderInfo.phone) {
          toast.error('Preencha todos os dados do titular');
          setIsProcessing(false);
          return;
        }

        if (!selectedInstallment) {
          toast.error('Selecione o número de parcelas');
          setIsProcessing(false);
          return;
        }

        // Obter IP do cliente
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const remoteIp = ipData.ip;

        // Validar dados do cartão antes de processar
        const validationErrors = validateCardData();
        if (validationErrors.length > 0) {
          toast.error('Por favor, corrija os seguintes erros:');
          validationErrors.forEach(error => toast.error(error));
          setIsProcessing(false);
          return;
        }

        // Atualizar checkout com informações de parcelamento
        const updateData = {
          payment_method: selectedPaymentMethod,
          installment_count: selectedInstallment.count,
          installment_value: selectedInstallment.value,
          total_value: selectedInstallment.totalValue,
        };

        const { error: updateError } = await supabase
          .schema('app_portfolio')
          .from('checkouts')
          .update(updateData)
          .eq('id', checkout.id);

        if (updateError) throw updateError;

        // Processar pagamento com cartão de crédito
        const { error: paymentError } = await supabase.functions.invoke('payment-api', {
          body: {
            action: 'create_credit_card_payment',
            checkout_id: checkout.id,
            creditCard: creditCard,
            creditCardHolderInfo: creditCardHolderInfo,
            remoteIp: remoteIp,
            installmentCount: selectedInstallment.count,
          }
        });

        if (paymentError) throw paymentError;

        toast.success('Pagamento processado com sucesso!');
        setShowConfirmDialog(false);
        
        // Atualizar dados do checkout
        await fetchCheckout();
        
        // Redirecionar para página de sucesso
        navigate(`/payment-success/${uniqueLink}`);
        
        setIsProcessing(false);
        return;
      }

      // Para PIX e Boleto, manter a lógica existente
      const paymentMethodChanged = checkout.payment_method && checkout.payment_method !== selectedPaymentMethod;
      const hasExistingCharge = !!checkout.asaas_charge_id;

      if (paymentMethodChanged && hasExistingCharge) {
        const { error: updateError } = await supabase.functions.invoke('payment-api', {
          body: {
            action: 'update_payment',
            checkout_id: checkout.id,
            billing_type: selectedPaymentMethod,
            value: checkout.value,
            due_date: checkout.due_date,
          }
        });

        if (updateError) throw updateError;

        toast.success('Método de pagamento atualizado!');
      } else {
        const updateData: any = {
          status: 'payment_selected',
          payment_method: selectedPaymentMethod,
        };

        const { error } = await supabase
          .schema('app_portfolio')
          .from('checkouts')
          .update(updateData)
          .eq('id', checkout.id);

        if (error) throw error;

        toast.success('Método de pagamento confirmado!');
        
        if (checkout) {
          setCheckout({ ...checkout, ...updateData });
        }
      }

      setShowConfirmDialog(false);
      
      await fetchCheckout();

      if (selectedPaymentMethod === 'pix') {
        await handlePixPayment();
      }

      if (selectedPaymentMethod === 'boleto') {
        await handleBoletoPayment();
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Erro ao confirmar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePixPayment = async () => {
    if (!checkout) return;

    // Verificar se já existe cobrança PIX
    if (checkout.asaas_charge_id) {
      // Buscar QR Code PIX existente pelo ID da cobrança
      try {
        const { data, error } = await supabase.functions.invoke('payment-api', {
          body: { action: 'get_pix_qr_code', asaas_charge_id: checkout.asaas_charge_id }
        });

        if (error) throw error;

        setPixData(data.pix);
        setPixExpiration(new Date(Date.now() + 8 * 60 * 1000)); // 8 minutos
        return;
      } catch (error: any) {
        console.error('Error fetching existing PIX:', error);
        // Se falhar, cria nova cobrança
      }
    }

    // Criar nova cobrança
    await createPixPayment();
  };

  const createPixPayment = async () => {
    if (!checkout) return;

    try {
      const { data, error } = await supabase.functions.invoke('payment-api', {
        body: { action: 'create_pix_payment', checkout_id: checkout.id }
      });

      if (error) throw error;

      setPixData(data.pix);
      setPixExpiration(new Date(Date.now() + 8 * 60 * 1000)); // 8 minutos
      
      // Atualizar checkout com dados do PIX
      await fetchCheckout();
    } catch (error: any) {
      console.error('Error creating PIX payment:', error);
      toast.error(error.message || 'Erro ao criar pagamento PIX');
    }
  };

  const handleBoletoPayment = async () => {
    if (!checkout) return;

    // Se não existe cobrança, criar nova
    if (!checkout.asaas_charge_id) {
      try {
        const { data, error } = await supabase.functions.invoke('payment-api', {
          body: { action: 'create_pix_payment', checkout_id: checkout.id }
        });

        if (error) throw error;

        // Atualizar checkout com dados
        await fetchCheckout();
      } catch (error: any) {
        console.error('Error creating boleto payment:', error);
        toast.error(error.message || 'Erro ao criar pagamento boleto');
        return;
      }
    }

    // Buscar campo de identificação do boleto
    try {
      const { data, error } = await supabase.functions.invoke('payment-api', {
        body: { action: 'get_boleto_identification', asaas_charge_id: checkout.asaas_charge_id }
      });

      if (error) throw error;

      setBoletoData(data.identification);
    } catch (error: any) {
      console.error('Error fetching boleto identification:', error);
      toast.error(error.message || 'Erro ao buscar dados do boleto');
    }
  };

  const installmentOptions = checkout ? calculateInstallments(checkout.value) : [];

  const getTimeRemaining = () => {
    if (!pixExpiration) return 0;
    const now = new Date();
    const diff = pixExpiration.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const formatTimeRemaining = () => {
    const seconds = getTimeRemaining();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (pixData && pixExpiration) {
      const interval = setInterval(() => {
        if (getTimeRemaining() <= 0) {
          setPixData(null);
          setPixExpiration(null);
          toast.error('Tempo de pagamento expirado');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pixData, pixExpiration]);

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

                  <Card className="bg-card border-white/10 mt-4">
                    <CardHeader>
                      <CardTitle className="text-white">Dados do Cartão</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Nome Impresso no Cartão</Label>
                        <Input
                          value={creditCard.holderName}
                          onChange={(e) => setCreditCard({ ...creditCard, holderName: e.target.value })}
                          placeholder="Como está no cartão"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Número do Cartão</Label>
                        <Input
                          value={formatCardNumber(creditCard.number)}
                          onChange={(e) => setCreditCard({ ...creditCard, number: e.target.value.replace(/\D/g, '') })}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white">Mês</Label>
                          <select
                            value={creditCard.expiryMonth}
                            onChange={(e) => setCreditCard({ ...creditCard, expiryMonth: e.target.value })}
                            className="w-full mt-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
                          >
                            <option value="">Mês</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                {String(i + 1).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label className="text-white">Ano</Label>
                          <select
                            value={creditCard.expiryYear}
                            onChange={(e) => setCreditCard({ ...creditCard, expiryYear: e.target.value })}
                            className="w-full mt-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
                          >
                            <option value="">Ano</option>
                            {Array.from({ length: 20 }, (_, i) => {
                              const year = new Date().getFullYear() + i;
                              return (
                                <option key={year} value={String(year)}>
                                  {year}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <Label className="text-white">CVV</Label>
                          <Input
                            value={creditCard.ccv}
                            onChange={(e) => setCreditCard({ ...creditCard, ccv: e.target.value.replace(/\D/g, '') })}
                            placeholder="123"
                            maxLength={3}
                            className="mt-1 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-white/10 mt-4">
                    <CardHeader>
                      <CardTitle className="text-white">Dados do Titular</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-white">Nome Completo</Label>
                        <Input
                          value={creditCardHolderInfo.name}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, name: e.target.value })}
                          placeholder="Nome do titular"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Email</Label>
                        <Input
                          type="email"
                          value={creditCardHolderInfo.email}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">CPF/CNPJ</Label>
                        <Input
                          value={formatCPF(creditCardHolderInfo.cpfCnpj)}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, cpfCnpj: e.target.value })}
                          placeholder="000.000.000-00"
                          maxLength={18}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">CEP</Label>
                        <Input
                          value={formatPostalCode(creditCardHolderInfo.postalCode)}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, postalCode: e.target.value })}
                          placeholder="00000-000"
                          maxLength={9}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Endereço e Número</Label>
                        <Input
                          value={creditCardHolderInfo.addressNumber}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, addressNumber: e.target.value })}
                          placeholder="Rua Exemplo, 123"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Complemento (opcional)</Label>
                        <Input
                          value={creditCardHolderInfo.addressComplement}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, addressComplement: e.target.value })}
                          placeholder="Apto 101"
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Telefone</Label>
                        <Input
                          value={formatPhone(creditCardHolderInfo.phone)}
                          onChange={(e) => setCreditCardHolderInfo({ ...creditCardHolderInfo, phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
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

              <div className="text-center">
                {pixExpiration && (
                  <p className={`text-lg font-bold ${getTimeRemaining() < 60 ? 'text-red-400' : 'text-neon-purple'}`}>
                    {formatTimeRemaining()}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  Tempo restante para pagamento
                </p>
              </div>

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

      {boletoData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center">Boleto Bancário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Código de Barras:</p>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-sm text-white break-all font-mono">
                    {boletoData.barCode}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(boletoData.barCode);
                    toast.success("Código de barras copiado!");
                  }}
                  className="w-full mt-2 bg-neon-purple hover:bg-neon-purple/90"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código de Barras
                </Button>
              </div>

              <Button
                onClick={() => setBoletoData(null)}
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
