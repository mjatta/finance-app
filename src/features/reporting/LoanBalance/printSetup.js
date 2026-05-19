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
  const candidate = dayjs(value);
  return candidate.isValid() ? candidate.format('YYYY-MM-DD') : String(value || '');
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  return [];
};

export const buildLoanBalancePrintHtml = (payload, context = {}) => {
  const rows = normalizeRows(payload);
  const firstRow = rows[0] ?? {};
  const companyName = String(firstRow?.com_name ?? '').trim() || 'Company';
  const address = String(firstRow?.caddress ?? '').trim();
  const telephone = String(firstRow?.tel ?? '').trim();
  const email = String(firstRow?.email ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const totals = rows.reduce((acc, row) => ({
    amountIssued: acc.amountIssued + toNumber(row?.PRINCIPAL_AMT),
    loanBalance: acc.loanBalance + toNumber(row?.LoanBalance ?? row?.nbookbal),
    savingsBalance: acc.savingsBalance + toNumber(row?.SavingsBalance),
    netLoan: acc.netLoan + toNumber(row?.NetLoan ?? row?.nnewbal),
    loanProvision: acc.loanProvision + toNumber(row?.LoanProvision),
  }), {
    amountIssued: 0,
    loanBalance: 0,
    savingsBalance: 0,
    netLoan: 0,
    loanProvision: 0,
  });

  const tableRows = rows.length > 0
    ? rows.map((row) => `
      <tr>
        <td class="num">${escapeHtml(String(row?.cacctnumb ?? '').trim())}</td>
        <td>${escapeHtml(String(row?.cacctname ?? '').trim())}</td>
        <td class="amt">${formatAmount(row?.PRINCIPAL_AMT)}</td>
        <td class="amt">${formatAmount(row?.LoanBalance ?? row?.nbookbal)}</td>
        <td class="amt">${formatAmount(row?.SavingsBalance)}</td>
        <td class="amt">${formatAmount(row?.NetLoan ?? row?.nnewbal)}</td>
        <td class="amt">${formatAmount(row?.LoanProvision)}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="7" class="no-data">No loan balance data found.</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Loan Balance</title>
      <style>
        :root {
          --text: #0f172a;
          --muted: #475569;
          --line: #cbd5e1;
          --header-bg: #e2e8f0;
          --stripe: #f8fafc;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 20px;
          font-family: "Segoe UI", Tahoma, sans-serif;
          color: var(--text);
          background: #fff;
        }
        .report {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }
        .header {
          position: relative;
          text-align: center;
          margin-bottom: 18px;
        }
        .meta-right {
          position: absolute;
          right: 0;
          top: 0;
          text-align: right;
          font-size: 12px;
          color: var(--muted);
        }
        .company {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }
        .line {
          font-size: 13px;
          color: var(--muted);
          margin: 2px 0;
        }
        .title {
          margin-top: 14px;
          font-size: 19px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .sub-title {
          margin-top: 2px;
          font-size: 12px;
          color: var(--muted);
        }
        .filters {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 8px;
          font-size: 12px;
          color: var(--muted);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          font-size: 12.5px;
        }
        thead th {
          background: var(--header-bg);
          border: 1px solid var(--line);
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
        }
        tbody td, tfoot td {
          border: 1px solid var(--line);
          padding: 7px 10px;
          vertical-align: top;
        }
        tbody tr:nth-child(even) {
          background: var(--stripe);
        }
        .num {
          width: 170px;
          white-space: nowrap;
        }
        .amt {
          width: 140px;
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        tfoot td {
          font-weight: 700;
          background: #f1f5f9;
        }
        .no-data {
          text-align: center;
          color: var(--muted);
        }

        @media print {
          body { padding: 8mm; }
          .report { max-width: none; }
          .meta-right { right: 0; }
        }
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
          <div class="title">Loan Balance</div>
          <div class="sub-title">Branch: ${escapeHtml(context.branchLabel || '')} | Date: ${escapeHtml(context.date || '')}</div>
          <div class="filters">
            <span>Product: ${escapeHtml(context.productLabel || '')}</span>
            <span>Member Status: ${escapeHtml(context.memberStatusLabel || '')}</span>
            <span>Customer Type: ${escapeHtml(context.customerTypeLabel || '')}</span>
            <span>Gender: ${escapeHtml(context.genderLabel || '')}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Account Name</th>
              <th>Amount Issued</th>
              <th>Loan Balance</th>
              <th>Savings Balance</th>
              <th>Net Loan</th>
              <th>Loan Provision</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total</td>
              <td class="amt">${formatAmount(totals.amountIssued)}</td>
              <td class="amt">${formatAmount(totals.loanBalance)}</td>
              <td class="amt">${formatAmount(totals.savingsBalance)}</td>
              <td class="amt">${formatAmount(totals.netLoan)}</td>
              <td class="amt">${formatAmount(totals.loanProvision)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;
};