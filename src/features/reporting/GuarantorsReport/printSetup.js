// Helper function to format currency amounts
const formatAmount = (value) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return value || '0.00';
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export const buildGuarantorsReportHtml = (data, filters, companyInfo = {}, regions = [], productTypes = []) => {
  const { region = '', productType = '', transactionFromDate = '', transactionToDate = '' } = filters;
  const { com_name = '', caddress = '', tel = '', email = '' } = companyInfo;

  // Map numeric region ID to region name
  const getRegionName = (regionId) => {
    if (!regionId) return '';
    const foundRegion = Array.isArray(regions) ? regions.find((r) => (r.coun_id || r.id) == regionId) : null;
    return foundRegion ? (foundRegion.coun_name?.trim() || foundRegion.name || regionId) : regionId;
  };

  // Map numeric product ID to product name
  const getProductName = (productId) => {
    if (!productId) return '';
    const foundProduct = Array.isArray(productTypes) ? productTypes.find((p) => p.value == productId) : null;
    return foundProduct ? foundProduct.label : productId;
  };

  // Group data by institution (ccustname)
  const groupedByInstitution = {};
  if (Array.isArray(data)) {
    data.forEach((row) => {
      const institution = (row.ccustname || 'Unknown Institution').trim();
      if (!groupedByInstitution[institution]) {
        groupedByInstitution[institution] = [];
      }
      groupedByInstitution[institution].push(row);
    });
  }

  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Guarantors Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .company-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
          }
          .company-header h2 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 18px;
            font-weight: bold;
          }
          .company-header .company-details {
            font-size: 12px;
            color: #555;
            margin: 4px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 20px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
            color: #666;
          }
          .filters {
            margin-bottom: 20px;
            font-size: 12px;
            color: #333;
          }
          .filters p {
            margin: 5px 0;
          }
          .institution-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .institution-header {
            background-color: #667eea;
            color: white;
            padding: 12px 15px;
            border-radius: 5px 5px 0 0;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
          }
          th {
            background-color: #f0f0f0;
            color: #333;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #ddd;
            font-size: 13px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
          }
          tfoot tr {
            background-color: #f0f0f0;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
          }
          tfoot td {
            padding: 12px;
            font-weight: bold;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body {
              margin: 0;
            }
            .no-print {
              display: none;
            }
            .institution-section {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          ${com_name ? `<h2>${com_name.trim()}</h2>` : ''}
          ${caddress ? `<div class="company-details">${caddress.trim()}</div>` : ''}
          ${tel ? `<div class="company-details">Tel: ${tel.trim()}</div>` : ''}
          ${email ? `<div class="company-details">Email: ${email.trim()}</div>` : ''}
        </div>

        <div class="header">
          <h1>Guarantors Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <div class="filters">
          ${(
            (() => {
              const filterParts = [];
              if (region) filterParts.push(`Region: ${getRegionName(region)}`);
              if (productType) filterParts.push(`Product Type: ${getProductName(productType)}`);
              if (transactionFromDate) filterParts.push(`From Date: ${transactionFromDate}`);
              if (transactionToDate) filterParts.push(`To Date: ${transactionToDate}`);
              
              const filtersText = filterParts.length > 0 ? filterParts.join(' | ') : 'No filters applied';
              return `<p><strong>Report Filters:</strong> ${filtersText}</p>`;
            })()
          )}
        </div>

        ${
          Object.keys(groupedByInstitution).length > 0
            ? Object.entries(groupedByInstitution)
                .map(
                  ([institution, rows]) => `
            <div class="institution-section">
              <div class="institution-header">${institution}</div>
              <table>
                <thead>
                  <tr>
                    <th>Guarantee Code</th>
                    <th>Guarantee Name</th>
                    <th>Account Name</th>
                    <th>Amount Guaranteed</th>
                    <th>Date</th>
                    <th>Product Name</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row) => `
                  <tr>
                    <td>${(row.grantorcode || '').trim()}</td>
                    <td>${(row.gcustname || '').trim()}</td>
                    <td>${(row.loanacct || '').trim()}</td>
                    <td class="amount">${formatAmount(row.guaramt)}</td>
                    <td>${formatDate(row.guardate)}</td>
                    <td>${(row.prd_name || '').trim()}</td>
                  </tr>
                `
                    )
                    .join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                    <td class="amount" style="font-weight: bold;">${formatAmount(
                      rows.reduce((sum, row) => sum + (Number(row.guaramt) || 0), 0)
                    )}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          `
                )
                .join('')
            : '<div style="text-align: center; padding: 20px;">No data available</div>'
        }

        <div class="footer">
          <p>This is a computer-generated report and does not require a signature.</p>
        </div>
      </body>
    </html>
  `;

  return html;
};
