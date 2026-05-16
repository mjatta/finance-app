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

export const buildIncomeStatementPrintHtml = (rows, reportDate) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const firstRow = safeRows[0] ?? {};
  const companyName = (firstRow.com_name ?? '').trim() || 'Company';
  const address = (firstRow.caddress ?? '').trim();
  const telephone = (firstRow.tel ?? '').trim();
  const email = (firstRow.email ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const reportDateLabel = dayjs(reportDate).isValid() ? dayjs(reportDate).format('YYYY-MM-DD') : reportDate;

  const totalDebit = safeRows.reduce((sum, row) => sum + Number(row?.debitClose ?? 0), 0);
  const totalCredit = safeRows.reduce((sum, row) => sum + Number(row?.creditClose ?? 0), 0);

  let previousCategory = '';
  let previousSubgroup = '';

  const tableRows = safeRows.map((row) => {
    const categoryName = (row?.categoryName ?? '').trim();
    const subgroupName = (row?.subgrpname ?? '').trim();
    const accountNumber = (row?.cacctnumb ?? '').trim();
    const accountName = (row?.cacctname ?? '').trim();

    const categoryRow = categoryName && categoryName !== previousCategory
      ? `<tr class="category-row"><td colspan="4">${escapeHtml(categoryName)}</td></tr>`
      : '';

    if (categoryName !== previousCategory) {
      previousCategory = categoryName;
      previousSubgroup = '';
    }

    const subgroupRow = subgroupName && subgroupName !== previousSubgroup
      ? `<tr class="subgroup-row"><td colspan="4">${escapeHtml(subgroupName)}</td></tr>`
      : '';

    previousSubgroup = subgroupName;

    return `${categoryRow}${subgroupRow}
      <tr>
        <td class="num">${escapeHtml(accountNumber)}</td>
        <td>${escapeHtml(accountName)}</td>
        <td class="amt">${formatAmount(row?.debitClose)}</td>
        <td class="amt">${formatAmount(row?.creditClose)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Income Statement</title>
      <style>
        :root {
          --text: #0f172a;
          --muted: #475569;
          --line: #cbd5e1;
          --header-bg: #e2e8f0;
          --stripe: #f8fafc;
          --category-bg: #dbeafe;
          --subgroup-bg: #eff6ff;
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
        thead .amount-group {
          text-align: center;
        }
        tbody td, tfoot td {
          border: 1px solid var(--line);
          padding: 7px 10px;
          vertical-align: top;
        }
        tbody tr:nth-child(even) {
          background: var(--stripe);
        }
        .category-row td {
          background: var(--category-bg);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .subgroup-row td {
          background: var(--subgroup-bg);
          font-weight: 600;
          color: #1e3a8a;
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
        tfoot td {
          font-weight: 700;
          background: #f1f5f9;
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
          <div class="title">Income Statement</div>
          <div class="sub-title">At Date: ${escapeHtml(reportDateLabel)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2">Account Number</th>
              <th rowspan="2">Account Name</th>
              <th colspan="2" class="amount-group">Amount</th>
            </tr>
            <tr>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total</td>
              <td class="amt">${formatAmount(totalDebit)}</td>
              <td class="amt">${formatAmount(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;
};
