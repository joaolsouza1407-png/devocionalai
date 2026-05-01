import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function gerarDevocional(nome, momentoDeVida) {
    const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
                  role: 'user',
                  content: `Voce e um pastor evangelico amoroso. Gere devocional personalizado para ${nome} que esta passando por: "${momentoDeVida}". Formato:\nBom dia, ${nome}!\n\nVersiculo:\n"[versiculo completo]"\n- [referencia]\n\nReflexao:\n[3 paragrafos tocantes ligando o versiculo ao momento da pessoa]\n\nOracao:\n[oracao pessoal terminando em Amen]\n\nCom amor, DevocionalAI`
          }],
          max_tokens: 800,
          temperature: 0.85,
    });
    return response.choices[0].message.content.trim();
}
