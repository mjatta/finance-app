export const buildTransactionListingPrintHtml = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '<html><body><h1>No transaction data available</h1></body></html>';
  }

  const firstRecord = data[0];
  const companyName = firstRecord.com_name?.trim() || 'Company';
  const address = firstRecord.caddress?.trim() || '';
  const phone = firstRecord.Expr1?.trim() || '';
  const email = firstRecord.email?.trim() || '';
  const printedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  const getFullName = (record) => {
    const fname = record.ccustfname?.trim() || '';
    const mname = record.ccustmname?.trim() || '';
    const lname = record.ccustlname?.trim() || '';
    return `${fname} ${mname} ${lname}`.replace(/\s+/g, ' ').trim();
  };

  // Calculate totals
  let totalCredit = 0;
  let totalDebit = 0;

  data.forEach((row) => {
    const amount = parseFloat(row.ntranamnt) || 0;
    if (amount > 0) {
      totalCredit += amount;
    } else {
      totalDebit += Math.abs(amount);
    }
  });

  // Build table rows
  const tableRows = data
    .map((row) => {
      const amount = parseFloat(row.ntranamnt) || 0;
      const credit = amount > 0 ? formatAmount(amount) : '';
      const debit = amount < 0 ? formatAmount(Math.abs(amount)) : '';

      return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; font-size: 11px;">${row.cacctnumb?.trim() || ''}</td>
          <td style="padding: 8px; font-size: 11px;">${getFullName(row)}</td>
          <td style="padding: 8px; font-size: 11px; text-align: center;">${formatDate(row.dtrandate)}</td>
          <td style="padding: 8px; font-size: 11px; text-align: right;">${credit}</td>
          <td style="padding: 8px; font-size: 11px; text-align: right;">${debit}</td>
          <td style="padding: 8px; font-size: 11px;">${row.ctrandesc?.trim() || ''}</td>
          <td style="padding: 8px; font-size: 11px;">${row.br_name?.trim() || ''}</td>
        </tr>
      `;
    })
    .join('');

  const totalsRow = `
    <tr style="background-color: #f5f5f5; font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333;">
      <td colspan="3" style="padding: 8px; text-align: right;">TOTAL</td>
      <td style="padding: 8px; text-align: right;">${formatAmount(totalCredit)}</td>
      <td style="padding: 8px; text-align: right;">${formatAmount(totalDebit)}</td>
      <td colspan="2" style="padding: 8px;"></td>
    </tr>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Transaction Listing</title>
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
          line-height: 1.4;
          color: var(--text);
          background: #fff;
        }
        .report {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media print {
          body { padding: 8mm; }
          .report { max-width: none; }
          .page-break {
            page-break-after: always;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid;
          }
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
        .report-title {
          margin-top: 14px;
          font-size: 19px;
          font-weight: 700;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          font-size: 12.5px;
        }
        th {
          background: var(--header-bg);
          color: var(--text);
          padding: 8px 10px;
          text-align: left;
          font-size: 12.5px;
          font-weight: 700;
          border: 1px solid var(--line);
        }
        td {
          padding: 7px 10px;
          font-size: 12.5px;
          border: 1px solid var(--line);
        }
        tr:nth-child(even) {
          background-color: var(--stripe);
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        tfoot td {
          font-weight: 700;
          background: #f1f5f9;
        }
      </style>
    </head>
    <body>
      <div class="report">
        <div class="header">
          <div class="meta-right">Printed: ${printedDate}</div>
          <div class="company">${companyName}</div>
          ${address ? `<div class="line">${address}</div>` : ''}
          ${phone ? `<div class="line">Tel: ${phone}</div>` : ''}
          ${email ? `<div class="line">Email: ${email}</div>` : ''}
          <div class="report-title">Transaction Listing</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Full Name</th>
              <th style="text-align: center;">Transaction Date</th>
              <th style="text-align: right;">Credit</th>
              <th style="text-align: right;">Debit</th>
              <th>Description</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            ${totalsRow}
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;

  return html;
};
