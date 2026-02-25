import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY is not configured');
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;
    const { action, ...body } = await req.json();

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    };

    if (action === 'create-payment') {
      const { name, cpfCnpj, email, phone } = body;

      // 1. Find or create customer
      // Search existing
      const searchRes = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfCnpj}`, {
        headers: asaasHeaders,
      });
      const searchData = await searchRes.json();

      let customerId: string;
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        // Create customer
        const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({ name, cpfCnpj, email, mobilePhone: phone }),
        });
        if (!customerRes.ok) {
          const err = await customerRes.text();
          throw new Error(`Asaas customer creation failed [${customerRes.status}]: ${err}`);
        }
        const customerData = await customerRes.json();
        customerId = customerData.id;
      }

      // 2. Create PIX payment
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: 99.90,
          dueDate: dueDateStr,
          description: 'Plano Clínica - Exames na Mão (Mensal)',
          externalReference: userId,
        }),
      });

      if (!paymentRes.ok) {
        const err = await paymentRes.text();
        throw new Error(`Asaas payment creation failed [${paymentRes.status}]: ${err}`);
      }

      const paymentData = await paymentRes.json();

      // 3. Get PIX QR Code
      const qrRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentData.id}/pixQrCode`, {
        headers: asaasHeaders,
      });

      let qrCode = null;
      if (qrRes.ok) {
        qrCode = await qrRes.json();
      }

      return new Response(JSON.stringify({
        success: true,
        payment: {
          id: paymentData.id,
          value: paymentData.value,
          status: paymentData.status,
          invoiceUrl: paymentData.invoiceUrl,
          bankSlipUrl: paymentData.bankSlipUrl,
          dueDate: paymentData.dueDate,
        },
        pix: qrCode ? {
          qrCodeImage: qrCode.encodedImage,
          qrCodePayload: qrCode.payload,
          expirationDate: qrCode.expirationDate,
        } : null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check-status') {
      const { paymentId } = body;
      const statusRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
        headers: asaasHeaders,
      });
      if (!statusRes.ok) {
        const err = await statusRes.text();
        throw new Error(`Asaas status check failed [${statusRes.status}]: ${err}`);
      }
      const statusData = await statusRes.json();
      return new Response(JSON.stringify({
        success: true,
        status: statusData.status,
        confirmedDate: statusData.confirmedDate,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Asaas payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
