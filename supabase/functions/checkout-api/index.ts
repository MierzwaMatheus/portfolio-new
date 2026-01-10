import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { action, ...params } = await req.json()

    let result

    switch (action) {
      case 'create_checkout': {
        const {
          customer_id,
          customer_name,
          customer_email,
          customer_cpf_cnpj,
          customer_mobile_phone,
          customer_company,
          customer_phone,
          value,
          description,
          due_date,
          billing_type,
          expires_at,
        } = params

        if (!customer_name || !customer_cpf_cnpj || !customer_mobile_phone || !value || !due_date) {
          return new Response(
            JSON.stringify({ error: 'Campos obrigatórios não fornecidos' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const uniqueLink = generateUniqueLink()

        const checkoutData = {
          unique_link: uniqueLink,
          customer_id: customer_id || null,
          customer_name,
          customer_email: customer_email || null,
          customer_cpf_cnpj,
          customer_mobile_phone,
          customer_company: customer_company || null,
          customer_phone: customer_phone || null,
          value: parseFloat(value),
          description: description || null,
          due_date,
          billing_type: billing_type || null,
          status: 'pending',
          expires_at: expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(checkoutData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao criar checkout')
        }

        const data = await response.json()
        result = { data: data[0] }
        break
      }

      case 'get_checkout': {
        const { unique_link } = params

        if (!unique_link) {
          return new Response(
            JSON.stringify({ error: 'unique_link não fornecido' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/checkouts?unique_link=eq.${unique_link}`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation',
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar checkout')
        }

        const data = await response.json()
        result = { data: data[0] || null }
        break
      }

      case 'update_checkout': {
        const { id, ...updateData } = params

        if (!id) {
          return new Response(
            JSON.stringify({ error: 'id não fornecido' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/checkouts?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(updateData),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao atualizar checkout')
        }

        const data = await response.json()
        result = { data: data[0] }
        break
      }

      case 'list_checkouts': {
        const { limit = 100, status } = params

        let url = `${supabaseUrl}/rest/v1/checkouts?limit=${limit}&order=created_at.desc&prefer=return=representation`
        
        if (status) {
          url += `&status=eq.${status}`
        }

        const response = await fetch(url, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao listar checkouts')
        }

        const data = await response.json()
        result = { data }
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
    console.error('Checkout API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar requisição' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generateUniqueLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
