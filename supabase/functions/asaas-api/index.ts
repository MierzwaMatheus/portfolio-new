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
    const asaasToken = Deno.env.get('ASAAS_TOKEN') || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjcxODBjNDczLWM5NTgtNDliMy1hMzUwLTg4M2FjNmQxZjYzYTo6JGFhY2hfOGY3MGQ0M2UtNjE3NC00OGQ4LTg5YjAtMjVhMDg0NzFhYWM1'
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3'
    
    if (!asaasToken) {
      return new Response(
        JSON.stringify({ error: 'ASAAS_TOKEN não configurada' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const { action, ...params } = await req.json()

    let result
    let endpoint = ''
    let method = 'GET'
    let body = null

    switch (action) {
      case 'list_customers':
        endpoint = `${asaasBaseUrl}/customers?limit=${params.limit || 100}`
        method = 'GET'
        break

      case 'create_customer':
        endpoint = `${asaasBaseUrl}/customers`
        method = 'POST'
        body = {
          name: params.name,
          cpfCnpj: params.cpfCnpj,
          mobilePhone: params.mobilePhone,
          company: params.company,
          email: params.email,
          phone: params.phone,
          address: params.address,
          addressNumber: params.addressNumber,
          complement: params.complement,
          province: params.province,
          postalCode: params.postalCode,
        }
        break

      case 'get_customer':
        endpoint = `${asaasBaseUrl}/customers/${params.customer_id}`
        method = 'GET'
        break

      case 'update_customer':
        endpoint = `${asaasBaseUrl}/customers/${params.customer_id}`
        method = 'POST'
        body = {
          name: params.name,
          cpfCnpj: params.cpfCnpj,
          mobilePhone: params.mobilePhone,
          company: params.company,
          email: params.email,
          phone: params.phone,
          address: params.address,
          addressNumber: params.addressNumber,
          complement: params.complement,
          province: params.province,
          postalCode: params.postalCode,
        }
        break

      case 'delete_customer':
        endpoint = `${asaasBaseUrl}/customers/${params.customer_id}`
        method = 'DELETE'
        break

      case 'list_charges':
        endpoint = `${asaasBaseUrl}/payments?limit=${params.limit || 100}`
        method = 'GET'
        break

      case 'create_charge':
        endpoint = `${asaasBaseUrl}/payments`
        method = 'POST'
        body = {
          customer: params.customer,
          billingType: params.billingType,
          value: params.value,
          dueDate: params.dueDate,
          description: params.description,
          installmentCount: params.installmentCount,
          installmentValue: params.installmentValue,
        }
        break

      case 'get_charge':
        endpoint = `${asaasBaseUrl}/payments/${params.charge_id}`
        method = 'GET'
        break

      case 'list_invoices':
        endpoint = `${asaasBaseUrl}/invoices?limit=${params.limit || 100}`
        method = 'GET'
        break

      case 'get_invoice':
        endpoint = `${asaasBaseUrl}/invoices/${params.invoice_id}`
        method = 'GET'
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não suportada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }

    const options: RequestInit = {
      method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: asaasToken,
        'User-Agent': 'matheus_mierzwa',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(endpoint, options)
    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.errors?.[0]?.description || data.message || 'Erro ao processar requisição' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      )
    }

    return new Response(
      JSON.stringify({ data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Asaas API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar requisição' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
