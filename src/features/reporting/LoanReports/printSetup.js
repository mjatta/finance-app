import dayjs from 'dayjs';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatAmount = (value) => toNumber(value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : String(value || '');
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

export const buildLoanReportPrintHtml = (payload, context = {}) => {
  const rows = normalizeRows(payload);
  const first = rows[0] ?? {};
  const creditUnion = context.creditUnion || {};
  const companyName = String(creditUnion?.com_name || creditUnion?.CompanyName || first?.com_name || '').trim() || 'Company';
  const branchName = (first?.br_name ?? first?.branchName ?? '').trim();
  const address = String((creditUnion?.caddress || creditUnion?.address || first?.caddress) ?? '').trim();
  const telephone = String((creditUnion?.tel || creditUnion?.telephone || first?.CompanyTel || first?.tel) ?? '').trim();
  const email = String((creditUnion?.email || creditUnion?.Email || first?.email) ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const totals = rows.reduce((acc, r) => {
    return {
      principal: acc.principal + toNumber(r?.PRINCIPAL_AMT),
      repayment: acc.repayment + toNumber(r?.REPAYMENT_AMT),
      totalBalance: acc.totalBalance + toNumber(r?.TOTALBALANCE),
    };
  }, { principal: 0, repayment: 0, totalBalance: 0 });

  const tableRows = rows.length > 0 ? rows.map((r) => `
    <tr>
      <td class="num">${escapeHtml(String(r?.LOAN_NUMBER || '').trim())}</td>
      <td>${escapeHtml(String(r?.ccustcode || '').trim())}</td>
      <td>${escapeHtml(((r?.ccustfname || '') + ' ' + (r?.ccustmname || '') + ' ' + (r?.ccustlname || '')).trim())}</td>
      <td>${escapeHtml(String(r?.prd_name || '').trim())}</td>
      <td class="amt">${formatAmount(r?.PRINCIPAL_AMT)}</td>
      <td class="amt">${formatAmount(r?.REPAYMENT_AMT)}</td>
      <td>${escapeHtml(formatDate(r?.loan_appl_date))}</td>
      <td>${escapeHtml(formatDate(r?.loan_appr_date))}</td>
      <td>${escapeHtml(r?.ISSUED_DATE && r.ISSUED_DATE !== '1900-01-01T00:00:00' ? formatDate(r.ISSUED_DATE) : '')}</td>
      <td>${escapeHtml(formatDate(r?.MATURITY_DATE))}</td>
      <td>${escapeHtml(String(r?.br_name || '').trim())}</td>
      <td class="amt">${formatAmount(r?.TOTALBALANCE)}</td>
    </tr>
  `).join('') : `
    <tr><td colspan="12" class="no-data">No data found.</td></tr>
  `;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loan Report</title>
    <style>
      :root{ --text:#0f172a; --muted:#475569; --line:#cbd5e1; --header-bg:#e2e8f0; --stripe:#f8fafc }
      *{box-sizing:border-box}
      body{margin:0;padding:20px;font-family:"Segoe UI", Tahoma, sans-serif;color:var(--text);background:#fff}
      .report{width:100%;max-width:1180px;margin:0 auto}
      .header{position:relative;text-align:center;margin-bottom:18px}
      .meta-right{position:absolute;right:0;top:0;text-align:right;font-size:12px;color:var(--muted)}
      .company{font-size:22px;font-weight:800;letter-spacing:0.3px;margin-bottom:4px}
      .line{font-size:13px;color:var(--muted);margin:2px 0}
      .title{margin-top:14px;font-size:19px;font-weight:700;text-transform:uppercase}
      .sub-title{margin-top:2px;font-size:12px;color:var(--muted)}
      table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}
      thead th{background:var(--header-bg);border:1px solid var(--line);padding:8px 10px;text-align:left;font-weight:700}
      tbody td,tfoot td{border:1px solid var(--line);padding:7px 10px;vertical-align:top}
      tbody tr:nth-child(even){background:var(--stripe)}
      .num{width:140px;white-space:nowrap}
      .amt{width:120px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
      tfoot td{font-weight:700;background:#f1f5f9}
      .no-data{text-align:center;color:var(--muted)}
      @media print{body{padding:8mm}.report{max-width:none}.meta-right{right:0}}
    </style>
  </head>
  <body>
    <div class="report">
      <div class="header">
        <div class="meta-right">Printed: ${escapeHtml(printedAt)}</div>
        <div class="company">${escapeHtml(companyName)}</div>
        ${branchName ? `<div class="line">${escapeHtml(branchName)}</div>` : ''}
        ${address ? `<div class="line">${escapeHtml(address)}</div>` : ''}
        ${telephone ? `<div class="line">Tel: ${escapeHtml(telephone)}</div>` : ''}
        ${email ? `<div class="line">Email: ${escapeHtml(email)}</div>` : ''}
        <div class="title">Loan Report</div>
        <div class="sub-title">${escapeHtml(context.subTitle || '')}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Loan No</th>
            <th>Client Code</th>
            <th>Client Name</th>
            <th>Product</th>
            <th>Principal</th>
            <th>Repayment</th>
            <th>Applied</th>
            <th>Approved</th>
            <th>Issued</th>
            <th>Maturity</th>
            <th>Branch</th>
            <th>Total Balance</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">Totals</td>
            <td class="amt">${formatAmount(totals.principal)}</td>
            <td class="amt">${formatAmount(totals.repayment)}</td>
            <td colspan="5"></td>
            <td class="amt">${formatAmount(totals.totalBalance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </body>
  </html>`;
};
