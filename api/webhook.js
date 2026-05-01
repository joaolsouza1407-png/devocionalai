import supabase from '../lib/supabase.js';
import { enviarEmailBoasVindas } from '../lib/mailer.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = req.headers['x-webhook-secret'] || req.query.secret;
  if (secret !== process.env.WEBHOOK_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const body = req.body;
    const status = (body?.status || body?.payment_status || '').toLowerCase();
    if (!['approved','paid','complete','completed'].includes(status)) return res.status(200).json({ ok: true });
    const email = body?.customer?.email || body?.email || '';
    const nome = body?.customer?.name || body?.name || 'Amigo(a)';
    if (!email) return res.status(400).json({ error: 'sem email' });
    await supabase.from('assinantes').upsert({ email, nome, status: 'pendente_onboarding', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'email' });
    const link = 'https://devocionalai.com.br/onboarding?email=' + encodeURIComponent(email) + '&nome=' + encodeURIComponent(nome);
    await enviarEmailBoasVindas(email, nome, link);
    return res.status(200).json({ success: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}