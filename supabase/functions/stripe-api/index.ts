import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY não configurada' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { action, ...params } = await req.json()

    let result

    switch (action) {
      case 'list_products':
        result = await stripe.products.list({ limit: 100 })
        return new Response(
          JSON.stringify({ data: result.data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'create_product':
        const { name, description } = params
        result = await stripe.products.create({
          name,
          description: description || undefined,
        })
        return new Response(
          JSON.stringify({ data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'list_prices':
        result = await stripe.prices.list({ limit: 100, expand: ['data.product'] })
        return new Response(
          JSON.stringify({ 
            data: result.data.map(price => ({
              id: price.id,
              product: typeof price.product === 'string' ? price.product : price.product.id,
              unit_amount: price.unit_amount,
              currency: price.currency,
              recurring: price.recurring ? {
                interval: price.recurring.interval,
                interval_count: price.recurring.interval_count,
              } : null,
            }))
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'create_price':
        const { product, unit_amount, currency, recurring } = params
        result = await stripe.prices.create({
          product,
          unit_amount,
          currency,
          recurring: recurring ? {
            interval: recurring.interval,
            interval_count: recurring.interval_count,
          } : undefined,
        })
        return new Response(
          JSON.stringify({ data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'create_payment_link':
        const { price, quantity, enable_installments } = params
        const paymentLinkParams: any = {
          line_items: [
            {
              price,
              quantity: quantity || 1,
            },
          ],
          payment_method_types: ['card'],
        }

        // Nota: O parcelamento é habilitado através das configurações globais
        // no Dashboard do Stripe (Settings > Payment methods > Card installments)
        // Quando habilitado no Dashboard, o Stripe automaticamente oferece
        // opções de parcelamento aos clientes com cartões brasileiros
        
        result = await stripe.paymentLinks.create(paymentLinkParams)
        return new Response(
          JSON.stringify({ data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'list_payment_links':
        result = await stripe.paymentLinks.list({ limit: 100 })
        return new Response(
          JSON.stringify({ 
            data: result.data
              .filter(link => link.active) // Filtrar apenas links ativos
              .map(link => ({
                id: link.id,
                url: link.url,
                price: link.line_items?.data[0]?.price?.id || '',
                product: link.line_items?.data[0]?.price?.product || '',
                created: link.created,
              }))
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'delete_payment_link':
        const { payment_link_id } = params
        if (!payment_link_id) {
          return new Response(
            JSON.stringify({ error: 'ID do link de pagamento é obrigatório' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }
        result = await stripe.paymentLinks.update(payment_link_id, { active: false })
        return new Response(
          JSON.stringify({ data: result, message: 'Link de pagamento desativado com sucesso' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }
  } catch (error: any) {
    console.error('Stripe API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar requisição' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

