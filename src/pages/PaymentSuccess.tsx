import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Checkout } from "@/types/checkout";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function PaymentSuccessPage() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const [, navigate] = useLocation();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        navigate('/');
        return;
      }

      setCheckout(data);
    } catch (error) {
      console.error('Error fetching checkout:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screenflex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!checkout) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-card border-white/10">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-16 h-16 text-green-500" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl text-white">Pagamento Realizado com Sucesso!</CardTitle>
            <p className="text-gray-400 mt-2">Obrigado pela sua compra</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Descrição:</span>
                <span className="text-white font-medium">{checkout.description || 'Pagamento'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Valor Total:</span>
                <span className="text-2xl font-bold text-neon-purple">
                  {formatCurrency(checkout.total_value || checkout.value || 0)}
                </span>
              </div>

              {checkout.payment_method && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Método de Pagamento:</span>
                  <span className="text-white font-medium capitalize">
                    {checkout.payment_method === 'pix' ? 'PIX' :
                     checkout.payment_method === 'boleto' ? 'Boleto' :
                     checkout.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                     checkout.payment_method}
                  </span>
                </div>
              )}

                    {checkout.installment_count && checkout.installment_count > 1 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Parcelamento:</span>
                        <span className="text-white font-medium">
                          {checkout.installment_count}x de {formatCurrency(checkout.installment_value || 0)}
                        </span>
                      </div>
                    )}

              {checkout.due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Data:</span>
                  <span className="text-white font-medium">
                    {new Date(checkout.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>


            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-neon-purple hover:bg-neon-purple/90 text-white font-medium py-6"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
