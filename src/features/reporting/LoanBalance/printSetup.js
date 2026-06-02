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
  const branchName = (firstRow?.br_name ?? firstRow?.branchName ?? '').trim();
  const address = String(firstRow?.caddress ?? '').trim();
  const telephone = String(firstRow?.tel ?? '').trim();
  const email = String(firstRow?.email ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const totals = rows.reduce((acc, row) => ({
    loanBalance: acc.loanBalance + toNumber(row?.LoanBalance ?? row?.nbookbal),
  }), {
    loanBalance: 0,
  });

  const tableRows = rows.length > 0
    ? rows.map((row) => {
      const age = (row?.nage ?? row?.age ?? row?.days_outstanding ?? '0').toString().trim();
      return `
        <tr>
          <td class="num">${escapeHtml(String(row?.cacctnumb ?? '').trim())}</td>
          <td>${escapeHtml(String(row?.cacctname ?? '').trim())}</td>
          <td class="amt">${formatAmount(row?.LoanBalance ?? row?.nbookbal)}</td>
          <td class="num">${escapeHtml(age)}</td>
        </tr>
      `;
    }).join('')
    : `
      <tr>
        <td colspan="4" class="no-data">No loan balance data found.</td>
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
          tfoot { display: table-row-group; }
        }
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
          <div class="title">Loan Balance</div>
          <div class="sub-title">As of: ${escapeHtml(context.date || '')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Account Name</th>
              <th>Loan Balance</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total</td>
              <td class="amt">${formatAmount(totals.loanBalance)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;
};