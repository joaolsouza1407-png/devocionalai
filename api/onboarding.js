import supabase from '../lib/supabase.js';
import { gerarDevocional } from '../lib/openai.js';
import { enviarMensagemWhatsApp } from '../lib/whatsapp.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email, nome, telefone, categoria, momento } = req.body;
    if (!email || !telefone) return res.status(400).json({ error: 'campos obrigatorios' });
    const tel = telefone.replace(/[^0-9]/g, '');
    const { error } = await supabase
      .from('assinantes')
      .upsert({ email, nome, telefone: tel, categoria, momento_de_vida: momento, status: 'ativo', updated_at: new Date().toISOString() }, { onConflict: 'email' });
    if (error) throw error;
    try {
      const devo = await gerarDevocional(nome, momento || categoria || 'gratidao e fe');
      await enviarMensagemWhatsApp(tel, devo);
    } catch(e) { console.error('Devocional inicial:', e.message); }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}