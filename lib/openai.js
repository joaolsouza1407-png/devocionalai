import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -----------------------------------------------------------------------
// Funcao original mantida para compatibilidade com cron antigo
// -----------------------------------------------------------------------
export async function gerarDevocional(nome, momentoDeVida) {
      const response = await client.chat.completions.create({
              model: 'gpt-4o',
              messages: [{
                        role: 'user',
                        content: `Voce e um pastor evangelico amoroso. Gere devocional personalizado para ${nome} que esta passando por: "${momentoDeVida}". Formato:\nBom dia [nome]!\n[mensagem de 3 paragrafos]\nVersiculo: [versiculo biblico]\nReflexao: [1 frase de reflexao]`,
              }],
              max_tokens: 800,
              temperature: 0.85,
      });
      return response.choices[0].message.content.trim();
}

// -----------------------------------------------------------------------
// Nova funcao: gera devocional personalizado baseado no estado emocional
// Retorna { texto, narracao } - texto para WhatsApp, narracao para audio TTS
// -----------------------------------------------------------------------
export async function gerarDevocionalEmocional(contexto) {
      const { nome, como_acordou, area_vida, nivel_fe } = contexto;

  const nivelFrases = {
          1: 'muito abalada, quase sem esperanca',
          2: 'abalada e fragilizada',
          3: 'no meio do caminho, tentando se manter firme',
          4: 'firme, mas precisando de encorajamento',
          5: 'muito firme e cheia de gratidao',
  };
      const descricaoFe = nivelFrases[nivel_fe] || nivelFrases[3];

  const prompt = `Voce e um pastor evangelico amoroso, sensivel e profundo.
  Receba estas informacoes sobre um assinante e crie um devocional completo e personalizado:

  - Nome: ${nome}
  - Como acordou hoje: "${como_acordou}"
  - Area de vida em foco: "${area_vida}"
  - Nivel de fe hoje (1-5): ${nivel_fe} (${descricaoFe})

  Crie um devocional no formato abaixo. Use linguagem calorosa, brasileira, com emojis pontuais.
  O devocional deve ser PROFUNDAMENTE personalizado ao estado emocional descrito.

  FORMATO OBRIGATORIO:
  TITULO: [titulo impactante relacionado ao estado emocional - max 8 palavras]
  TEXTO: [3 paragrafos de reflexao biblica aplicada ao momento de vida - total 120 a 150 palavras]
  VERSICULO: [versiculo biblico relevante e completo com referencia]
  REFLEXAO: [1 frase de reflexao pratica para o dia - max 20 palavras]
  NARRACAO: [versao simplificada do texto para audio, sem emojis, fluida para leitura em voz alta - 80 a 100 palavras]`;

  const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.85,
  });

  const raw = response.choices[0].message.content.trim();

  // Parseia cada secao
  const extrair = (label) => {
          const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
          const match = raw.match(regex);
          return match ? match[1].trim() : '';
  };

  const titulo = extrair('TITULO');
      const textoPuro = extrair('TEXTO');
      const versiculo = extrair('VERSICULO');
      const reflexao = extrair('REFLEXAO');
      const narracao = extrair('NARRACAO');

  // Monta o texto final formatado para WhatsApp
  const texto = [
          `━━━━━━━━━━━━━━━━━━━━━`,
          `🙏 *${titulo}*`,
          `━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          textoPuro,
          ``,
          `📖 *"${versiculo}"*`,
          ``,
          `✨ *Reflexao do dia:* ${reflexao}`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━`,
          `_DevocionalAI — sua mensagem diaria personalizada_ 🌿`,
        ].join('\n');

  return { texto, narracao: narracao || textoPuro };
}

// -----------------------------------------------------------------------
// Gera audio narrado (TTS) usando OpenAI
// Retorna Buffer do audio MP3 ou null se falhar
// -----------------------------------------------------------------------
export async function gerarAudioDevocional(texto) {
      try {
              const response = await client.audio.speech.create({
                        model: 'tts-1',
                        voice: 'nova', // Voz feminina suave em portugues
                        input: texto,
                        response_format: 'mp3',
              });
              const buffer = Buffer.from(await response.arrayBuffer());
              return buffer;
      } catch (err) {
              console.error('Erro ao gerar audio TTS:', err.message);
              return null;
      }
}
