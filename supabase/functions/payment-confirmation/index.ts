import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  console.log('Método:', req.method)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  console.log('URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  // Verificar se tem authorization header com service key
  const authHeader = req.headers.get('authorization')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log('Auth header:', authHeader)
  console.log('Expected service key:', supabaseServiceKey ? 'present' : 'missing')
  
  // Se não tiver auth header, vamos tentar prosseguir mesmo assim
  // (algumas configurações do Supabase podem permitir isso)
  
  try {
    const body = await req.json()
    console.log('Body:', JSON.stringify(body, null, 2))
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook recebido com sucesso',
        received: new Date().toISOString()
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
