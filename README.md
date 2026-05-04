# 🙏 Devocional IA — Mini SaaS no WhatsApp

> Devocional personalizado por IA entregue todo dia no WhatsApp, baseado no estado emocional do assinante.

---

## ✨ Como funciona

1. **Compra na Cakto** → cliente paga e recebe mensagem automática no WhatsApp
2. **Bot emocional** → pergunta como o cliente está se sentindo (3 perguntas)
3. **IA personaliza** → GPT-4o gera um devocional bíblico baseado nas respostas
4. **Entrega diária** → texto + áudio narrado enviados às 7h todo dia

---

## 🔗 URLs prontas para configurar

| Destino | URL |
|---------|-----|
| **Webhook Cakto** | `https://devocionalai.com/api/webhook` |
| **Webhook Z-API** | `https://devocionalai.com/api/whatsapp-incoming` |
| **Site / Landing** | `https://devocionalai.com` |
| **Onboarding** | `https://devocionalai.com/onboarding` |

---

## ⚙️ Configuração na Cakto

1. Acesse seu produto na Cakto
2. Vá em **Integrações → Webhooks**
3. Adicione:
   - **URL:** `https://devocionalai.com/api/webhook`
   - **Evento:** `purchase.approved`
4. Salve

Quando uma compra for aprovada, o sistema automaticamente:
- Cadastra o cliente no banco de dados
- Envia mensagem de boas-vindas no WhatsApp
- Inicia o fluxo de perguntas emocionais

---

## 📱 Configuração na Z-API

1. Acesse sua instância na Z-API
2. Vá em **Webhooks → Mensagens Recebidas**
3. Configure: `https://devocionalai.com/api/whatsapp-incoming`

---

## 🔑 Variáveis de ambiente (Vercel)

| Variável | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://[seu-projeto].supabase.co` |
| `SUPABASE_KEY` | Chave anon do Supabase |
| `OPENAI_API_KEY` | Sua chave OpenAI (sk-...) |
| `WEBHOOK_SECRET` | `[defina-um-secret-forte]` |
| `CRON_SECRET` | `[defina-um-secret-forte]` |
| `ZAPI_INSTANCE_ID` | ID da instância Z-API |
| `ZAPI_TOKEN` | Token da Z-API |
| `ZAPI_CLIENT_TOKEN` | Client token da Z-API |

---

## 🤖 Fluxo do bot emocional

```
[CRON 10:00 UTC / 07:00 Brasília]
        ↓
  "Como você acordou hoje?"
        ↓ resposta
  "Qual área da sua vida precisa mais atenção agora?"
        ↓ resposta
  "De 1 a 5, como está sua fé hoje?"
        ↓ resposta
  GPT-4o gera devocional personalizado
        ↓
  Texto + Áudio enviados no WhatsApp ✅
```

---

## 🗄️ Banco de dados (Supabase)

- **assinantes** — dados dos clientes
- **conversas** — estado do bot por usuário
- **envios** — histórico de devocionais enviados

---

## 🚀 Tecnologias

- **Vercel** (hospedagem + serverless functions)
- **Supabase** (banco de dados PostgreSQL)
- **OpenAI GPT-4o** (geração do devocional)
- **OpenAI TTS** (narração em áudio, voz nova)
- **Z-API** (envio de mensagens WhatsApp)
- **GitHub Actions** (cron diário gratuito)
- **Cakto** (plataforma de pagamentos)
