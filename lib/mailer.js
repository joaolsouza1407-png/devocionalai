import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
export async function enviarEmailBoasVindas(email, nome, link) {
  await t.sendMail({
    from: '"DevocionalAI" <' + process.env.EMAIL_USER + '>',
    to: email,
    subject: 'Bem-vindo! Ative seu DevocionalAI',
    html: '<div style="font-family:Arial;padding:40px;background:#111;color:#fff"><h2 style="color:#C9A84C">Ola ' + nome + '!</h2><p style="color:#aaa;margin:16px 0">Acesso confirmado! Clique para ativar:</p><a href="' + link + '" style="background:#C9A84C;color:#000;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:800;display:block;text-align:center">Ativar meu devocional</a></div>'
  });
}