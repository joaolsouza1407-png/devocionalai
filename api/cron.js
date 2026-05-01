import supabase from '../lib/supabase.js';
import { gerarDevocional } from '../lib/openai.js';
import { enviarMensagemWhatsApp } from '../lib/whatsapp.js';
export default async function handler(req, res) {
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { data: assinantes, error } = await supabase.from('assinantes').select('*').eq('status', 'ativo');
    if (error) throw error;
    const resultados = [];
    for (const a of assinantes) {
      try {
        const devo = await gerarDevocional(a.nome, a.momento_de_vida || a.categoria || 'fe e gratidao');
        await enviarMensagemWhatsApp(a.telefone, devo);
        await supabase.from('envios').insert({ assinante_email: a.email, mensagem: devo, enviado_em: new Date().toISOString(), status: 'enviado' });
        resultados.push({ email: a.email, status: 'ok' });
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        await supabase.from('envios').insert({ assinante_email: a.email, mensagem: null, enviado_em: new Date().toISOString(), status: 'erro', erro: err.message });
        resultados.push({ email: a.email, status: 'erro' });
      }
    }
    return res.status(200).json({ success: true, total: assinantes.length, resultados });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}