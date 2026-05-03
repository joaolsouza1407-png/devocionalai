import axios from 'axios';

const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

function zapiUrl(endpoint) {
    return `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/${endpoint}`;
}

const zapiHeaders = () => ({
    'Client-Token': ZAPI_CLIENT_TOKEN,
    'Content-Type': 'application/json',
});

function normalizarTelefone(telefone) {
    const numero = telefone.replace(/[^0-9]/g, '');
    return numero.startsWith('55') ? numero : '55' + numero;
}

export async function enviarMensagemWhatsApp(telefone, mensagem) {
    const phone = normalizarTelefone(telefone);
    const { data } = await axios.post(
          zapiUrl('send-text'),
      { phone, message: mensagem },
      { headers: zapiHeaders() }
        );
    return data;
}

export async function enviarAudioWhatsApp(telefone, audioBuffer) {
    try {
          const phone = normalizarTelefone(telefone);
          const audioBase64 = audioBuffer.toString('base64');
          const { data } = await axios.post(
                  zapiUrl('send-audio'),
            { phone, audio: `data:audio/mpeg;base64,${audioBase64}` },
            { headers: zapiHeaders() }
                );
          return data;
    } catch (err) {
          console.error('Erro ao enviar audio:', err?.response?.data || err.message);
          return null;
    }
}

export async function enviarImagemWhatsApp(telefone, imageUrl, legenda) {
    const phone = normalizarTelefone(telefone);
    const { data } = await axios.post(
          zapiUrl('send-image'),
      { phone, image: imageUrl, caption: legenda || '' },
      { headers: zapiHeaders() }
        );
    return data;
}
