import axios from 'axios';
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;
export async function enviarMensagemWhatsApp(telefone, mensagem) {
  const numero = telefone.replace(/[^0-9]/g, '');
  const phone = numero.startsWith('55') ? numero : '55' + numero;
  const url = 'https://api.z-api.io/instances/' + ZAPI_INSTANCE + '/token/' + ZAPI_TOKEN + '/send-text';
  const { data } = await axios.post(url, { phone, message: mensagem }, { headers: { 'Client-Token': ZAPI_CLIENT_TOKEN } });
  return data;
}