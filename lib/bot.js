import supabase from './supabase.js';
import { gerarDevocionalEmocional, gerarAudioDevocional } from './openai.js';
import { enviarMensagemWhatsApp, enviarAudioWhatsApp } from './whatsapp.js';

// Perguntas do bot emocional
const PERGUNTAS = {
  p1: (nome) => `Bom dia, ${nome}! 🌅✨\n\nQue alegria ter mais um dia ao seu lado!\n\nMe conta... *como você acordou hoje?* Seu coração está leve, pesado, agitado? Pode falar à vontade 💙`,
    p2: () => `Obrigado por compartilhar isso comigo 🙏\n\nMe ajuda a entender melhor: esse sentimento está mais ligado a *trabalho*, *relacionamentos*, *saúde*, *espiritualidade* ou algo mais pessoal?`,
      p3: () => `Entendo... Em uma escala de *1 a 5*, como você descreveria sua fé e esperança *hoje*?\n\n1️⃣ Muito abalada\n2️⃣ Abalada\n3️⃣ No meio termo\n4️⃣ Firme\n5️⃣ Muito firme\n\nResponda apenas o número 😊`,
        processando: () => `Obrigado pela sua honestidade 🙏\n\n_Estou preparando uma mensagem especial para você, baseada em tudo que compartilhou..._\n\n⏳ Só um momento...`,
        };

        // Inicia o fluxo do bot para um assinante
        export async function iniciarFluxoDiario(assinante) {
          const { email, nome, telefone } = assinante;

            // Limpa conversa anterior do dia
              await supabase.from('conversas').upsert({
                  telefone,
                      email,
                          nome,
                              estado: 'aguardando_p1',
                                  respostas: {},
                                      criado_em: new Date().toISOString(),
                                          atualizado_em: new Date().toISOString(),
                                            }, { onConflict: 'telefone' });

                                              // Envia primeira pergunta
                                                await enviarMensagemWhatsApp(telefone, PERGUNTAS.p1(nome));
                                                }

                                                // Processa resposta recebida do usuário
                                                export async function processarResposta(telefone, mensagem) {
                                                  const { data: conversa, error } = await supabase
                                                      .from('conversas')
                                                          .select('*')
                                                              .eq('telefone', telefone)
                                                                  .single();

                                                                    if (error || !conversa) return; // Usuário não identificado

                                                                      const estado = conversa.estado;
                                                                        const respostas = conversa.respostas || {};

                                                                          if (estado === 'aguardando_p1') {
                                                                              respostas.como_acordou = mensagem;
                                                                                  await atualizarConversa(telefone, 'aguardando_p2', respostas);
                                                                                      await enviarMensagemWhatsApp(telefone, PERGUNTAS.p2());

                                                                                        } else if (estado === 'aguardando_p2') {
                                                                                            respostas.area_vida = mensagem;
                                                                                                await atualizarConversa(telefone, 'aguardando_p3', respostas);
                                                                                                    await enviarMensagemWhatsApp(telefone, PERGUNTAS.p3());
                                                                                                    
                                                                                                      } else if (estado === 'aguardando_p3') {
                                                                                                          respostas.nivel_fe = mensagem.replace(/[^1-5]/g, '') || '3';
                                                                                                              await atualizarConversa(telefone, 'processando', respostas);
                                                                                                              
                                                                                                                  // Avisa que está processando
                                                                                                                      await enviarMensagemWhatsApp(telefone, PERGUNTAS.processando());
                                                                                                                      
                                                                                                                          // Gera e entrega o devocional personalizado
                                                                                                                              await gerarEEntregarDevocional(conversa.nome, telefone, conversa.email, respostas);
                                                                                                                                }
                                                                                                                                  // Se estado for 'concluido' ou 'processando', ignora novas mensagens
                                                                                                                                  }
                                                                                                                                  
                                                                                                                                  // Gera devocional com IA e entrega via WhatsApp
                                                                                                                                  async function gerarEEntregarDevocional(nome, telefone, email, respostas) {
                                                                                                                                    try {
                                                                                                                                        const contexto = {
                                                                                                                                              nome,
                                                                                                                                                    como_acordou: respostas.como_acordou,
                                                                                                                                                          area_vida: respostas.area_vida,
                                                                                                                                                                nivel_fe: parseInt(respostas.nivel_fe) || 3,
                                                                                                                                                                    };
                                                                                                                                                                    
                                                                                                                                                                        // Gera texto do devocional com IA
                                                                                                                                                                            const devocional = await gerarDevocionalEmocional(contexto);
                                                                                                                                                                            
                                                                                                                                                                                // Envia o devocional em texto
                                                                                                                                                                                    await enviarMensagemWhatsApp(telefone, devocional.texto);
                                                                                                                                                                                    
                                                                                                                                                                                        // Gera e envia áudio narrado (TTS OpenAI)
                                                                                                                                                                                            const audioBuffer = await gerarAudioDevocional(devocional.narracao);
                                                                                                                                                                                                if (audioBuffer) {
                                                                                                                                                                                                      await enviarAudioWhatsApp(telefone, audioBuffer);
                                                                                                                                                                                                          }
                                                                                                                                                                                                          
                                                                                                                                                                                                              // Registra no banco
                                                                                                                                                                                                                  await supabase.from('envios').insert({
                                                                                                                                                                                                                        assinante_email: email,
                                                                                                                                                                                                                              mensagem: devocional.texto,
                                                                                                                                                                                                                                    respostas_bot: respostas,
                                                                                                                                                                                                                                          enviado_em: new Date().toISOString(),
                                                                                                                                                                                                                                                status: 'enviado',
                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                        // Marca conversa como concluída
                                                                                                                                                                                                                                                            await atualizarConversa(telefone, 'concluido', respostas);
                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                                  console.error('Erro ao gerar devocional:', err.message);
                                                                                                                                                                                                                                                                      await enviarMensagemWhatsApp(
                                                                                                                                                                                                                                                                            telefone,
                                                                                                                                                                                                                                                                                  `${nome}, ocorreu um problema ao gerar seu devocional hoje 😔\nMas Deus te ama e amanhã estaremos aqui novamente! 🙏`
                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                          await atualizarConversa(telefone, 'erro', respostas);
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                            async function atualizarConversa(telefone, estado, respostas) {
                                                                                                                                                                                                                                                                                              await supabase.from('conversas').update({
                                                                                                                                                                                                                                                                                                  estado,
                                                                                                                                                                                                                                                                                                      respostas,
                                                                                                                                                                                                                                                                                                          atualizado_em: new Date().toISOString(),
                                                                                                                                                                                                                                                                                                            }).eq('telefone', telefone);
                                                                                                                                                                                                                                                                                                            }
