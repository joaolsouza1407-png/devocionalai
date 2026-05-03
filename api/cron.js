import supabase from '../lib/supabase.js';
import { iniciarFluxoDiario } from '../lib/bot.js';

// Cron job diario - roda as 07:00 horario de Brasilia (10:00 UTC)
// Configurado no vercel.json: schedule "0 10 * * *"
// Inicia o fluxo de perguntas emocionais para todos os assinantes ativos
export default async function handler(req, res) {
    if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
          return res.status(401).json({ error: 'Unauthorized' });
    }

  try {
        const { data: assinantes, error } = await supabase
          .from('assinantes')
          .select('*')
          .eq('status', 'ativo');

      if (error) throw error;

      const resultados = [];

      for (const assinante of assinantes) {
              try {
                        // Inicia o fluxo conversacional (envia a 1a pergunta emocional)
                await iniciarFluxoDiario(assinante);
                        resultados.push({ email: assinante.email, status: 'iniciado' });

                // Espera 1s entre cada usuario para nao sobrecarregar a API
                await new Promise(r => setTimeout(r, 1000));
              } catch (err) {
                        console.error(`Erro ao iniciar fluxo para ${assinante.email}:`, err.message);
                        resultados.push({ email: assinante.email, status: 'erro', erro: err.message });
              }
      }

      return res.status(200).json({
              success: true,
              total: assinantes.length,
              resultados,
              hora: new Date().toISOString(),
      });

  } catch (err) {
        return res.status(500).json({ error: err.message });
  }
}
