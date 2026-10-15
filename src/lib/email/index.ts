import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_123456789')) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PredictMarket <onboarding@resend.dev>';

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Seu código de acesso: ${otp} - PredictMarket`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Código de Acesso Temporário</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #4B5563;">Use o código abaixo para entrar na sua conta PredictMarket. Ele expira em 15 minutos:</p>
        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10B981;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #9CA3AF;">Se você não solicitou este código, ignore este e-mail com segurança.</p>
      </div>
    `,
  });
}

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Acesso sem senha - PredictMarket',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Acesse sua Conta com 1 Clique</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #4B5563;">Clique no botão abaixo para entrar diretamente no PredictMarket sem precisar de senha:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${magicLinkUrl}" style="background-color: #10B981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Entrar no PredictMarket</a>
        </div>
        <p style="font-size: 13px; color: #9CA3AF;">Este link é válido por 30 minutos e expira após o primeiro uso.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Redefinição de Senha - PredictMarket',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Redefinição de Senha</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #4B5563;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no link abaixo para criar uma nova senha:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #10B981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 13px; color: #9CA3AF;">Se você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Bem-vindo ao PredictMarket!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Olá, ${fullName}!</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #4B5563;">Sua conta no PredictMarket foi criada com sucesso.</p>
        <p style="font-size: 15px; line-height: 1.5; color: #4B5563;">Agora você pode escanear suas notas fiscais (NFC-e), prever o custo da sua despensa e comparar preços reais dos supermercados da sua região.</p>
        <p style="font-size: 13px; color: #9CA3AF; margin-top: 32px;">Equipe PredictMarket · Florianópolis, SC</p>
      </div>
    `,
  });
}
