import { processarResposta } from '../lib/bot.js';

// Endpoint que recebe mensagens enviadas pelo usuario no WhatsApp
// Configure a URL deste endpoint no painel da Z-API / Evolution API como webhook de mensagens recebidas
// URL: https://devocionalai.com/api/whatsapp-incoming
export default async function handler(req, res) {
    // Verificacao GET para validar webhook (alguns providers usam isso)
  if (req.method === 'GET') {
        const challenge = req.query['hub.challenge'];
        if (challenge) return res.status(200).send(challenge);
        return res.status(200).json({ ok: true, status: 'webhook ativo' });
  }

  if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
        const body = req.body;

      // --- Suporte Z-API ---
      // Formato: { phone: '5511999999999', text: { message: 'ola' }, fromMe: false }
      let telefone = null;
        let mensagem = null;

      if (body?.phone && body?.text?.message !== undefined) {
              // Z-API
          if (body.fromMe) return res.status(200).json({ ok: true }); // Ignora mensagens enviadas pelo bot
          telefone = body.phone.replace(/\D/g, '');
              mensagem = body.text?.message || body.caption || '';

      } else if (body?.data?.key?.remoteJid) {
              // Evolution API
          if (body.data.key.fromMe) return res.status(200).json({ ok: true });
              telefone = body.data.key.remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
              mensagem = body.data.message?.conversation ||
                                 body.data.message?.extendedTextMessage?.text || '';

      } else if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
              // Meta Cloud API (WhatsApp Business)
          const msg = body.entry[0].changes[0].value.messages[0];
              telefone = msg.from;
              mensagem = msg.text?.body || '';

      } else {
              // Formato nao reconhecido - loga e retorna ok
          console.log('Webhook recebido formato desconhecido:', JSON.stringify(body));
              return res.status(200).json({ ok: true });
      }

      if (!telefone || !mensagem.trim()) {
              return res.status(200).json({ ok: true }); // Ignora mensagens de midia sem texto
      }

      // Processa a resposta no bot emocional (nao-bloqueante)
      processarResposta(telefone, mensagem.trim()).catch(console.error);

      return res.status(200).json({ ok: true });
  } catch (err) {
        console.error('Erro no webhook incoming:', err.message);
        return res.status(200).json({ ok: true }); // Sempre retorna 200 para nao reenvios do provider
  }
}
