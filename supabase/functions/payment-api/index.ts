import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const asaasToken = Deno.env.get('ASAAS_TOKEN') || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjcxODBjNDczLWM5NTgtNDliMy1hMzUwLTg4M2FjNmQxZjYzYTo6JGFhY2hfOGY3MGQ0M2UtNjE3NC00OGQ4LTg5YjAtMjVhMDg0NzFhYWM1'
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3'

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasAsaasToken: !!asaasToken,
      hasAsaasBaseUrl: !!asaasBaseUrl,
    })

    if (!supabaseUrl || !supabaseServiceKey || !asaasToken || !asaasBaseUrl) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, ...params } = await req.json()

    let result

    switch (action) {
      case 'create_pix_payment': {
        const { checkout_id } = params

        console.log('checkout_id:', checkout_id)

        if (!checkout_id) {
          return new Response(
            JSON.stringify({ error: 'checkout_id não fornecido' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        // Buscar dados do checkout
        console.log('Fetching checkout with id:', checkout_id)
        
        const { data: checkoutData, error: checkoutError } = await supabase
          .schema('app_portfolio')
          .from('checkouts')
          .select('*')
          .eq('id', checkout_id)
          .single()

        console.log('Checkout data:', checkoutData)
        console.log('Checkout error:', checkoutError)

        if (checkoutError) {
          throw new Error(`Erro ao buscar checkout: ${checkoutError.message}`)
        }

        const checkout = checkoutData

        if (!checkout) {
          throw new Error('Checkout não encontrado')
        }

        if (checkout.status !== 'payment_selected') {
          throw new Error('Checkout não está pronto para pagamento')
        }

        if (checkout.payment_method !== 'pix') {
          throw new Error('Método de pagamento inválido')
        }

        // Criar pagamento no Asaas
        const paymentData = {
          billingType: 'PIX',
          customer: checkout.customer_id,
          value: checkout.value,
          dueDate: checkout.due_date,
          description: checkout.description || '',
          externalReference: checkout.unique_link,
        }

        const asaasPaymentResponse = await fetch(`${asaasBaseUrl}/payments`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': asaasToken,
          },
          body: JSON.stringify(paymentData),
        })

        if (!asaasPaymentResponse.ok) {
          const error = await asaasPaymentResponse.json()
          throw new Error(error.message || 'Erro ao criar pagamento no Asaas')
        }

        const asaasPayment = await asaasPaymentResponse.json()

        // Buscar QR Code PIX
        const pixQrCodeResponse = await fetch(
          `${asaasBaseUrl}/payments/${asaasPayment.id}/pixQrCode`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'access_token': asaasToken,
            },
          }
        )

        if (!pixQrCodeResponse.ok) {
          const error = await pixQrCodeResponse.json()
          throw new Error(error.message || 'Erro ao buscar QR Code PIX')
        }

        const pixData = await pixQrCodeResponse.json()

        // Atualizar checkout com dados do PIX
        const { error: updateError } = await supabase
          .schema('app_portfolio')
          .from('checkouts')
          .update({
            status: 'payment_confirmed',
            asaas_charge_id: asaasPayment.id,
            pix_qr_code: pixData.payload,
            pix_qr_code_image: pixData.encodedImage,
            pix_expiration_date: pixData.expirationDate,
          })
          .eq('id', checkout_id)

        if (updateError) {
          throw new Error(`Erro ao atualizar checkout: ${updateError.message}`)
        }

        result = {
          success: true,
          pix: pixData,
          asaas_payment_id: asaasPayment.id,
        }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Payment API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar requisição' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
