import dayjs from 'dayjs';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const buildGroupReportPrintHtml = (rows, reportDate, creditUnion = {}) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const companyName = (creditUnion.ComName || creditUnion.com_name || creditUnion.CompanyName || 'Company').trim();
  const address = (creditUnion.caddress || creditUnion.address || '').trim();
  const telephone = (creditUnion.tel || creditUnion.telephone || '').trim();
  const email = (creditUnion.email || creditUnion.Email || '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const reportDateLabel = dayjs(reportDate).isValid() ? dayjs(reportDate).format('YYYY-MM-DD') : reportDate;

  const tableRows = safeRows.map((r) => `
    <tr>
      <td>${escapeHtml(String(r.ID ?? ''))}</td>
      <td>${escapeHtml(String((r.FirstName ?? '') + ' ' + (r.LastName ?? '')))}</td>
      <td class="amt">${formatAmount(r.LoanAmount)}</td>
      <td>${escapeHtml(String(r.Sector ?? ''))}</td>
      <td>${escapeHtml(String(r.ExpiryDate ?? ''))}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Group Report</title>
      <style>
        :root { --text: #0f172a; --muted: #475569; --line: #cbd5e1; --header-bg: #e2e8f0; --stripe: #f8fafc; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 20px; font-family: "Segoe UI", Tahoma, sans-serif; color: var(--text); background: #fff; }
        .report { width: 100%; max-width: 1050px; margin: 0 auto; }
        .header { position: relative; text-align: center; margin-bottom: 18px; }
        .meta-right { position: absolute; right: 0; top: 0; text-align: right; font-size: 12px; color: var(--muted); }
        .company { font-size: 22px; font-weight: 800; letter-spacing: 0.3px; margin-bottom: 4px; }
        .line { font-size: 13px; color: var(--muted); margin: 2px 0; }
        .title { margin-top: 14px; font-size: 19px; font-weight: 700; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12.5px; }
        thead th { background: var(--header-bg); border: 1px solid var(--line); padding: 8px 10px; text-align: left; font-weight: 700; }
        tbody td { border: 1px solid var(--line); padding: 7px 10px; vertical-align: top; }
        tbody tr:nth-child(even) { background: var(--stripe); }
        .amt { text-align: right; font-variant-numeric: tabular-nums; }
        @media print { body { padding: 8mm; } .report { max-width: none; } .meta-right { right: 0; } }
      </style>
    </head>
    <body>
      <div class="report">
        <div class="header">
          <div class="meta-right">Printed: ${escapeHtml(printedAt)}</div>
          <div class="company">${escapeHtml(companyName)}</div>
          ${address ? `<div class="line">${escapeHtml(address)}</div>` : ''}
          ${telephone ? `<div class="line">Tel: ${escapeHtml(telephone)}</div>` : ''}
          ${email ? `<div class="line">Email: ${escapeHtml(email)}</div>` : ''}
          <div class="title">Group Report</div>
          <div class="sub-title">Generated: ${escapeHtml(reportDateLabel)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Loan Amount</th>
              <th>Sector</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};
