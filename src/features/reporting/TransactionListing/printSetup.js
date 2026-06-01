export const buildTransactionListingPrintHtml = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '<html><body><h1>No transaction data available</h1></body></html>';
  }

  const firstRecord = data[0];
  const companyName = firstRecord.com_name?.trim() || 'Company';
  const address = firstRecord.caddress?.trim() || '';
  const phone = firstRecord.Expr1?.trim() || '';
  const email = firstRecord.email?.trim() || '';
  const printedDate = new Date().toLocaleString();

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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
        }
        @media print {
          body {
            margin: 0;
            padding: 10mm;
          }
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
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .company-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .company-details h2 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .company-details p {
          font-size: 11px;
          margin: 2px 0;
        }
        .print-info {
          text-align: right;
          font-size: 11px;
          color: #666;
        }
        .report-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background-color: #667eea;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 11px;
          font-weight: bold;
          border: 1px solid #667eea;
        }
        td {
          padding: 8px;
          font-size: 11px;
          border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="company-info">
          <div class="company-details">
            <h2>${companyName}</h2>
            <p>${address}</p>
            <p>Tel: ${phone}</p>
            <p>Email: ${email}</p>
          </div>
          <div class="print-info">
            <p><strong>Printed:</strong> ${printedDate}</p>
            <p>Transaction Listing Report</p>
          </div>
        </div>
      </div>

      <div class="report-title">TRANSACTION LISTING</div>

      <!-- Table -->
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
    </body>
    </html>
  `;

  return html;
};
