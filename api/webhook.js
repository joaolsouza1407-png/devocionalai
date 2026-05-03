import supabase from '../lib/supabase.js';
import { enviarEmailBoasVindas } from '../lib/mailer.js';

// -----------------------------------------------------------------------
// Webhook de pagamentos - compativel com Cakto
// URL para configurar na Cakto: https://devocionalai.com/api/webhook
// -----------------------------------------------------------------------
// Formato do payload Cakto:
// {
//   event: "purchase.approved" | "purchase.canceled" | "purchase.refunded",
//   data: {
//     purchase: { status, transaction_id },
//     customer: { name, email, phone_number },
//     product: { id, name }
//   }
// }
export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  // Valida o token secreto (configure WEBHOOK_SECRET nas env vars da Vercel)
  const secret = req.headers['x-webhook-secret'] ||
                     req.headers['x-cakto-signature'] ||
                     req.query.secret;

  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
        const body = req.body;

      // ---- Detecta formato Cakto ----
      let email = '';
        let nome = '';
        let telefone = '';
        let statusCompra = '';

      if (body?.event && body?.data) {
              // Formato CAKTO
          const evento = body.event || '';
              const customer = body.data?.customer || {};
              const purchase = body.data?.purchase || {};

          email = customer.email || '';
              nome = customer.name || customer.full_name || 'Amigo(a)';
              telefone = (customer.phone_number || customer.phone || '').replace(/\D/g, '');

          const statusMap = {
                    'purchase.approved': 'approved',
                    'purchase.paid': 'approved',
                    'purchase.complete': 'approved',
                    'purchase.canceled': 'canceled',
                    'purchase.refunded': 'refunded',
                    'purchase.chargeback': 'refunded',
          };
              statusCompra = statusMap[evento] || purchase.status || '';

      } else {
              // Formato generico (legado)
          statusCompra = (body?.status || body?.payment_status || '').toLowerCase();
              email = body?.customer?.email || body?.email || '';
              nome = body?.customer?.name || body?.name || 'Amigo(a)';
              telefone = (body?.customer?.phone || body?.phone || '').replace(/\D/g, '');
      }

      // So processa compras aprovadas
      if (!['approved', 'paid', 'complete', 'completed'].includes(statusCompra)) {
              return res.status(200).json({ ok: true, skipped: true, status: statusCompra });
      }

      if (!email) {
              return res.status(400).json({ error: 'Email do comprador nao encontrado no payload' });
      }

      // Salva assinante no Supabase
      await supabase.from('assinantes').upsert({
              email,
              nome,
              telefone: telefone || null,
              status: 'pendente_onboarding',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      // Envia email de boas-vindas com link de onboarding
      const link = 'https://devocionalai.com/onboarding?email=' +
              encodeURIComponent(email) + '&nome=' + encodeURIComponent(nome);

      await enviarEmailBoasVindas(email, nome, link);

      console.log(`Novo assinante cadastrado: ${email} (${nome})`);
        return res.status(200).json({ success: true, email });

  } catch (err) {
        console.error('Erro no webhook:', err.message);
        return res.status(500).json({ error: err.message });
  }
}
