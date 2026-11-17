type EmailInput = {
  to: string;
  subject: string;
  html: string;
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Optional transactional email through Resend. When no key is configured the
 * platform keeps working and password resets are generated from the admin
 * panel instead (merchant support sends the one-time link manually).
 */
export async function sendEmail({ to, subject, html }: EmailInput) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Bee Panal <noreply@beepanal.store>",
        to: [to],
        subject,
        html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function passwordResetEmail(name: string, url: string) {
  return {
    subject: "إعادة تعيين كلمة المرور — Bee Panal",
    html: `
      <div dir="rtl" style="font-family:Arial,Tahoma,sans-serif;line-height:1.8;color:#1c1917">
        <h2 style="margin:0 0 12px">مرحبًا ${name || "بك"} 👋</h2>
        <p>وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك على Bee Panal.</p>
        <p>اضغط على الرابط التالي خلال ساعة واحدة:</p>
        <p style="margin:20px 0">
          <a href="${url}" style="background:#d97706;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">
            إعادة تعيين كلمة المرور
          </a>
        </p>
        <p style="font-size:13px;color:#78716c">لو مش انت اللي طلبت ده، تجاهل الرسالة وكلمة المرور هتفضل زي ما هي.</p>
      </div>
    `,
  };
}
