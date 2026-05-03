import supabase from '../lib/supabase.js';
import { enviarMensagemWhatsApp } from '../lib/whatsapp.js';

// -----------------------------------------------------------------------
// Webhook de pagamentos - compativel com Cakto
// URL para configurar na Cakto: https://devocionalai.com/api/webhook
// Evento: purchase.approved
// -----------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sempre retorna 200 para evitar reenvios da Cakto
  try {
    const body = req.body;

    // ---- Detecta formato Cakto ----
    let email = '';
    let nome = '';
    let telefone = '';
    let statusCompra = '';

    if (body?.event && body?.data) {
      // Formato CAKTO v2
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
      // Formato generico / legado
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
      console.error('Email nao encontrado no payload');
      return res.status(200).json({ ok: true, warning: 'email nao encontrado' });
    }

    // Normaliza telefone para formato 55XXXXXXXXXXX
    let telFinal = telefone.replace(/\D/g, '');
    if (telFinal && !telFinal.startsWith('55')) {
      telFinal = '55' + telFinal;
    }

    // Salva assinante no Supabase com status pendente_onboarding
    const { error: dbError } = await supabase.from('assinantes').upsert({
      email,
      nome,
      telefone: telFinal || null,
      status: 'pendente_onboarding',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (dbError) {
      console.error('Erro ao salvar assinante:', dbError.message);
    }

    // Envia mensagem de boas-vindas no WhatsApp (se tiver telefone)
    if (telFinal) {
      const primeiroNome = nome.split(' ')[0];
      const msgBoasVindas =
        `Ola ${primeiroNome}! 🙏\n\n` +
        `Seja bem-vindo(a) ao *Devocional IA*!\n\n` +
        `Todos os dias, as 7h da manha, voce vai receber uma mensagem personalizada com:\n` +
        `📖 Uma palavra biblica baseada em como voce esta se sentindo\n` +
        `🎵 Um audio devocional com a mensagem narrada\n\n` +
        `Para comecarmos, preciso saber um pouco sobre voce. Responda aqui mesmo pelo WhatsApp quando estiver pronto(a)!\n\n` +
        `*Como voce esta se sentindo hoje?* 😊`;

      try {
        await enviarMensagemWhatsApp(telFinal, msgBoasVindas);
      } catch (wErr) {
        console.error('Erro ao enviar WhatsApp de boas-vindas:', wErr.message);
      }
    }

    console.log(`Novo assinante cadastrado: ${email} (${nome}) | tel: ${telFinal}`);
    return res.status(200).json({ success: true, email });

  } catch (err) {
    console.error('Erro no webhook:', err.message);
    // Sempre 200 para Cakto nao reenviar
    return res.status(200).json({ ok: true, error: err.message });
  }
}
