/** Starter HTML for new transactional email templates in the admin editor. */
export const EMAIL_TEMPLATE_STARTER_HTML = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;background:#ffffff;border:1px solid #e8e4dc;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="background:#1e3a5f;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#d4a017;">Kingdom Deliverance Centre</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Your email headline</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px;color:#334155;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 16px;">Dear {{customer_name}},</p>
      <p style="margin:0 0 16px;">Write your message here. Use variables like <strong>{{order_number}}</strong> or <strong>{{total_amount}}</strong> where needed.</p>
      <p style="margin:24px 0 0;">
        <a href="{{order_link}}" style="display:inline-block;background:#d4a017;color:#1e3a5f;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">Call to action</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px;background:#f8f6f2;text-align:center;font-size:12px;color:#64748b;">
      <p style="margin:0;">Kingdom Deliverance Centre Uganda · kdcuganda.org</p>
    </td>
  </tr>
</table>`
