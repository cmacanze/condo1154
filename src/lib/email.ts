import { formatMZN, formatMonth } from "@/lib/utils";

interface OverdueNotificationData {
  residentName: string;
  residentEmail: string;
  apartmentName: string;
  referenceMonth: Date;
  totalDue: number;
  totalPaid: number;
  outstandingAmount: number;
  lateFeeAmount: number;
}

export async function sendOverdueNotification(data: OverdueNotificationData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const month = formatMonth(data.referenceMonth);
  const outstanding = formatMZN(data.outstandingAmount.toString());

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@condo1154.mz",
    to: data.residentEmail,
    subject: `Condomínio 1154 — Quota em atraso: ${month}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #1e40af; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">CONDOMÍNIO 1154</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
          <p>Caro/a <strong>${data.residentName}</strong>,</p>
          <p>Informamos que a quota referente a <strong>${month}</strong> do apartamento <strong>${data.apartmentName}</strong> encontra-se em atraso.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #6b7280; padding: 4px 0;">Total Devido:</td>
                <td style="text-align: right; font-weight: bold;">${formatMZN(data.totalDue.toString())}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 4px 0;">Total Pago:</td>
                <td style="text-align: right; color: #15803d; font-weight: bold;">${formatMZN(data.totalPaid.toString())}</td>
              </tr>
              ${data.lateFeeAmount > 0 ? `
              <tr>
                <td style="color: #6b7280; padding: 4px 0;">Multa de Atraso:</td>
                <td style="text-align: right; color: #dc2626;">${formatMZN(data.lateFeeAmount.toString())}</td>
              </tr>` : ""}
              <tr style="border-top: 1px solid #fecaca;">
                <td style="padding: 8px 0 4px; font-weight: bold;">Valor em Aberto:</td>
                <td style="text-align: right; font-size: 18px; font-weight: bold; color: #dc2626;">${outstanding}</td>
              </tr>
            </table>
          </div>
          <p>Por favor, regularize o pagamento o mais brevemente possível para evitar multas adicionais.</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Este email foi gerado automaticamente pelo sistema de gestão do Condomínio 1154.</p>
        </div>
      </div>
    `,
  });
}
