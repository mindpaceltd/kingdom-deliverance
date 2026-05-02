import { sendSystemEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kdcuganda.org'

export async function sendOrderConfirmation(
  order: any,
  downloadTokens: { token: string; product_name: string }[]
) {
  const orderNumber = order.order_number || order.id.split('-')[0]
  const customerName = order.customer_name || order.shipping_address?.name || 'Customer'

  const itemRows = order.order_items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;">$${(item.price_at_purchase * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  const downloadSection =
    downloadTokens.length > 0
      ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="margin:0 0 12px;color:#1e40af;font-size:16px;">📥 Your Digital Downloads</h3>
        <p style="color:#1e40af;font-size:13px;margin:0 0 16px;">Click below to download your products. Links expire in 7 days (max 5 downloads each).</p>
        ${downloadTokens
          .map(
            (dt) => `
          <a href="${SITE_URL}/api/downloads/${dt.token}" 
             style="display:block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;margin:8px 0;font-weight:bold;font-size:14px;text-align:center;">
            Download: ${dt.product_name}
          </a>`
          )
          .join('')}
      </div>`
      : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
      <!-- Header -->
      <div style="background:#1e3a5f;padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Order Confirmed! ✓</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Kingdom Deliverance Centre Uganda</p>
      </div>
      
      <!-- Body -->
      <div style="padding:32px;">
        <p style="font-size:16px;color:#1f2937;">Hi ${customerName},</p>
        <p style="font-size:14px;color:#6b7280;line-height:1.6;">
          Thank you for your purchase! Your order <strong>#${orderNumber}</strong> has been received and is being processed.
        </p>

        <!-- Order Details -->
        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:12px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Product</th>
              <th style="padding:12px 16px;text-align:center;font-size:12px;text-transform:uppercase;color:#6b7280;">Qty</th>
              <th style="padding:12px 16px;text-align:right;font-size:12px;text-transform:uppercase;color:#6b7280;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:16px;font-weight:bold;font-size:16px;">Total</td>
              <td style="padding:16px;font-weight:bold;font-size:16px;text-align:right;">${order.currency || 'USD'} ${Number(order.total_amount).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        ${downloadSection}

        <!-- Support -->
        <div style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:24px;">
          <p style="font-size:13px;color:#6b7280;margin:0;">
            If you have any questions, reply to this email or contact us at 
            <a href="mailto:info@kdcuganda.org" style="color:#1e3a5f;">info@kdcuganda.org</a>
          </p>
        </div>
      </div>
    </div>
    
    <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px;">
      © Kingdom Deliverance Centre Uganda. All rights reserved.
    </p>
  </div>
</body>
</html>`

  const text = `Order Confirmed! #${orderNumber}\n\nHi ${customerName},\n\nThank you for your purchase. Your order has been received.\n\nTotal: ${order.currency || 'USD'} ${Number(order.total_amount).toLocaleString()}\n\n${downloadTokens.length > 0 ? 'Download your products at:\n' + downloadTokens.map((dt) => `${dt.product_name}: ${SITE_URL}/api/downloads/${dt.token}`).join('\n') : ''}\n\nKingdom Deliverance Centre Uganda`

  await sendSystemEmail(order.email, `Order Confirmed #${orderNumber} - KDC Uganda`, html, text)
}
