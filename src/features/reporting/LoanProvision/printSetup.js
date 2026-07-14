export const buildLoanProvisionDetailsPrintHtml = (data, date) => {
  if (!Array.isArray(data) || data.length === 0) {
    return '<h2>No data available</h2>';
  }

  const firstRow = data[0];
  const companyName = (firstRow.com_name || '').trim();
  const address = (firstRow.caddress || '').trim();
  const tel = (firstRow.tel || '').trim();
  const email = (firstRow.email || '').trim();
  const printedDate = new Date().toLocaleString();

  const formatAmount = (value) => {
    const amount = Number(value ?? 0);
    if (Number.isNaN(amount)) return '0.00';
    const abs = Math.abs(amount);
    return abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Group data by days range
  const groupedData = {};
  const ageRanges = [];

  data.forEach((row) => {
    const key = `${row.DaysFrom || 'N/A'}-${row.DaysTo || 'N/A'}`;
    if (!groupedData[key]) {
      groupedData[key] = {
        daysFrom: row.DaysFrom,
        daysTo: row.DaysTo,
        ageCategory: row.LoanAgeCategory || '',
        rows: [],
        savingsBalance: 0,
        loanBalance: 0,
        netLoan: 0,
        provisioningAmount: 0,
        percentage: 0,
      };
      ageRanges.push(key);
    }

    const group = groupedData[key];
    group.rows.push(row);
    group.savingsBalance += Number(row.SavingsBalance ?? 0);
    group.loanBalance += Number(row.LoanBalance ?? 0);
    group.netLoan += Number(row.nnewbal ?? 0) - Number(row.nbookbal ?? 0);
    group.provisioningAmount += Number(row.LoanProvision ?? 0);
  });

  // Calculate totals
  let totalSavingsBalance = 0;
  let totalLoanBalance = 0;
  let totalNetLoan = 0;
  let totalProvisioningAmount = 0;
  let totalPercentage = 0;

  data.forEach((row) => {
    totalSavingsBalance += Number(row.SavingsBalance ?? 0);
    totalLoanBalance += Number(row.LoanBalance ?? 0);
    totalNetLoan += Number(row.nnewbal ?? 0) - Number(row.nbookbal ?? 0);
    totalProvisioningAmount += Number(row.LoanProvision ?? 0);
  });

  const tableRows = ageRanges
    .map((key) => {
      const group = groupedData[key];
      const daysLabel = group.ageCategory || `${group.daysFrom || 'N/A'}-${group.daysTo || 'N/A'}`;
      const percentage = group.loanBalance !== 0 && group.provisioningAmount !== 0
        ? ((Math.abs(group.provisioningAmount) / Math.abs(group.loanBalance)) * 100).toFixed(2)
        : '0.00';

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${daysLabel}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatAmount(group.savingsBalance)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatAmount(group.loanBalance)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatAmount(group.netLoan)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatAmount(group.provisioningAmount)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${percentage}%</td>
        </tr>
      `;
    })
    .join('');

  const totalPercentageCalc = totalLoanBalance !== 0 && totalProvisioningAmount !== 0
    ? ((Math.abs(totalProvisioningAmount) / Math.abs(totalLoanBalance)) * 100).toFixed(2)
    : '0.00';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Loan Provision Details</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background-color: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 20px;
        }
        .company-info {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .company-details {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 10px;
          color: #667eea;
        }
        .report-date {
          font-size: 12px;
          color: #999;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 13px;
        }
        th {
          background-color: #667eea;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #667eea;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f0f0f0;
        }
        tfoot tr {
          background-color: #efefef;
          font-weight: bold;
        }
        tfoot td {
          border-top: 2px solid #667eea;
          border-bottom: 2px solid #667eea;
          padding: 10px 8px;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
            max-width: 100%;
          }
          tfoot {
            display: table-row-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">${companyName}</div>
          <div class="company-details">
            <div>${address}</div>
            <div>Tel: ${tel}</div>
            <div>Email: ${email}</div>
          </div>
          <div class="report-title">Loan Provision Details</div>
          <div class="report-date">Date: ${date} | Printed: ${printedDate}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Days (from - to)</th>
              <th style="text-align: right;">Savings Balance</th>
              <th style="text-align: right;">Loan Balance</th>
              <th style="text-align: right;">Net Loan</th>
              <th style="text-align: right;">Provisioning Amount</th>
              <th style="text-align: right;">Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL</td>
              <td class="text-right">${formatAmount(totalSavingsBalance)}</td>
              <td class="text-right">${formatAmount(totalLoanBalance)}</td>
              <td class="text-right">${formatAmount(totalNetLoan)}</td>
              <td class="text-right">${formatAmount(totalProvisioningAmount)}</td>
              <td class="text-right">${totalPercentageCalc}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;

  return html;
};
