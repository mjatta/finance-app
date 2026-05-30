import dayjs from 'dayjs';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatAmount = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return '0.00';
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const buildSavingsBalancePrintHtml = (rows, reportDate) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const firstRow = safeRows[0] ?? {};
  const companyName = (firstRow.com_name ?? '').trim() || 'Company';
  const branchName = (firstRow.br_name ?? firstRow.branchName ?? '').trim();
  const address = (firstRow.caddress ?? '').trim();
  const telephone = (firstRow.tel ?? '').trim();
  const email = (firstRow.email ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const reportDateLabel = dayjs(reportDate).isValid() ? dayjs(reportDate).format('YYYY-MM-DD') : reportDate;

  const tableRows = safeRows.map((row) => {
    const accountNumber = (row?.account_number ?? row?.cacctnumb ?? '').trim();
    const accountName = (row?.account_name ?? row?.cacctname ?? '').trim();
    const accountBalance = formatAmount(row?.balance ?? row?.accountBalance ?? 0);
    const age = (row?.age ?? row?.days_outstanding ?? '0').toString().trim();

    return `
      <tr>
        <td class="num">${escapeHtml(accountNumber)}</td>
        <td>${escapeHtml(accountName)}</td>
        <td class="amt">${accountBalance}</td>
        <td class="num">${escapeHtml(age)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Savings Balance</title>
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
          max-width: 1050px;
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
        tbody td {
          border: 1px solid var(--line);
          padding: 7px 10px;
          vertical-align: top;
        }
        tbody tr:nth-child(even) {
          background: var(--stripe);
        }
        .num {
          width: 180px;
          white-space: nowrap;
        }
        .amt {
          width: 150px;
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
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
          ${branchName ? `<div class="line">${escapeHtml(branchName)}</div>` : ''}
          ${address ? `<div class="line">${escapeHtml(address)}</div>` : ''}
          ${telephone ? `<div class="line">Tel: ${escapeHtml(telephone)}</div>` : ''}
          ${email ? `<div class="line">Email: ${escapeHtml(email)}</div>` : ''}
          <div class="title">Savings Balance</div>
          <div class="sub-title">To Date: ${escapeHtml(reportDateLabel)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Account Name</th>
              <th>Account Balance</th>
              <th>Age</th>
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
