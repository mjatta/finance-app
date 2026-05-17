import dayjs from 'dayjs';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
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
  if (!value) {
    return '';
  }

  const candidate = dayjs(value);
  return candidate.isValid() ? candidate.format('YYYY-MM-DD') : String(value);
};

const pickFirst = (row, keys) => {
  if (!row || typeof row !== 'object') {
    return '';
  }

  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
};

const buildMemberName = (row, fallbackName = '') => {
  const direct = String(pickFirst(row, ['MemberName', 'memberName', 'CustomerName', 'customerName', 'ccustname']) || '').trim();
  if (direct) {
    return direct;
  }

  const firstName = String(row?.ccustfname ?? '').trim();
  const middleName = String(row?.ccustmname ?? '').trim();
  const lastName = String(row?.ccustlname ?? '').trim();
  const fromParts = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

  if (fromParts) {
    return fromParts;
  }

  return String(fallbackName || '').trim();
};

const getPaymentFrequencyLabel = (row) => {
  const explicit = pickFirst(row, ['PaymentFrequency', 'paymentFrequency', 'Frequency', 'frequency']);
  if (String(explicit ?? '').trim()) {
    return explicit;
  }

  const countPerYear = toNumber(pickFirst(row, ['nofpayperyear', 'NofPayPerYear', 'NOFPAYPERYEAR']));
  if (countPerYear <= 0) {
    return '';
  }
  if (countPerYear === 12) {
    return 'Monthly';
  }
  if (countPerYear === 4) {
    return 'Quarterly';
  }
  if (countPerYear === 2) {
    return 'Semi-Annual';
  }
  if (countPerYear === 1) {
    return 'Annual';
  }

  return `${countPerYear} / year`;
};

const extractRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const preferredKeys = [
    'Schedule',
    'schedule',
    'Rows',
    'rows',
    'Data',
    'data',
    'LoanSchedule',
    'loanSchedule',
    'RepaymentSchedule',
    'repaymentSchedule',
  ];

  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  const firstArrayValue = Object.values(payload ?? {}).find((value) => (
    Array.isArray(value) && value.length > 0 && typeof value[0] === 'object'
  ));

  return Array.isArray(firstArrayValue) ? firstArrayValue : [];
};

export const buildLoanSchedulePrintHtml = (payload, context = {}) => {
  const rows = extractRows(payload);
  const firstRow = rows[0] ?? {};

  const companyName = (pickFirst(firstRow, ['com_name', 'CompanyName', 'companyName']) || 'Company').toString().trim();
  const address = String(pickFirst(firstRow, ['caddress', 'Address', 'address']) || '').trim();
  const telephone = String(pickFirst(firstRow, ['tel', 'Telephone', 'telephone', 'PhoneNumber']) || '').trim();
  const email = String(pickFirst(firstRow, ['email', 'Email']) || '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const summarySource = {
    ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}),
    ...firstRow,
    CustomerCode: context.customerCode,
    AccountNumber: context.accountNumber,
    CustomerName: context.customerName,
  };

  const memberName = buildMemberName(summarySource, context.customerName);

  const summaryLeft = [
    { label: 'Member Name', value: memberName },
    { label: 'Principal Amount', value: formatAmount(pickFirst(summarySource, ['PRINCIPAL_AMT', 'PrincipalAmount', 'principalAmount', 'Principal', 'principal'])) },
    { label: 'Interest', value: formatAmount(pickFirst(summarySource, ['LOAN_INTEREST', 'Interest', 'interest', 'InterestAmount', 'interestAmount'])) },
    { label: 'Loan Duration', value: pickFirst(summarySource, ['LDURATION_NUM', 'LoanDuration', 'loanDuration', 'Duration', 'duration']) },
    { label: 'Total Interest', value: formatAmount(pickFirst(summarySource, ['TOTAL_INTEREST', 'TotalInterest', 'totalInterest'])) },
    { label: 'Total Amount', value: formatAmount(pickFirst(summarySource, ['TOTALBALANCE', 'TotalAmount', 'totalAmount', 'Amount', 'amount'])) },
  ];

  const summaryRight = [
    { label: 'Operations Number', value: pickFirst(summarySource, ['loanid', 'OperationsNumber', 'operationsNumber', 'OperationNumber', 'operationNumber', 'OperationNo']) },
    { label: 'Grace Period', value: pickFirst(summarySource, ['graceperiod', 'GracePeriod', 'gracePeriod']) },
    { label: 'Grace Period Interest', value: formatAmount(pickFirst(summarySource, ['graceperiodinterest', 'GracePeriodInterest', 'gracePeriodInterest'])) },
    { label: 'First Payment Date', value: formatDate(pickFirst(summarySource, ['Expr1', 'FirstPaymentDate', 'firstPaymentDate', 'StartDate', 'startDate'])) },
    { label: 'Payment Frequency', value: getPaymentFrequencyLabel(summarySource) },
    { label: 'Periodic Payment', value: formatAmount(pickFirst(summarySource, ['REPAYMENT_AMT', 'npayment', 'PeriodicPayment', 'periodicPayment', 'PaymentPerPeriod', 'paymentPerPeriod'])) },
  ];

  const scheduleRows = rows.map((row, index) => {
    const periodicPayment = toNumber(pickFirst(row, ['npayment', 'PeriodicPayment', 'periodicPayment', 'PaymentPerPeriod', 'paymentPerPeriod', 'RepaymentAmount', 'repaymentAmount']));
    const principal = toNumber(pickFirst(row, ['nprinpmnt', 'Principal', 'principal', 'PrincipalAmount', 'principalAmount']));
    const interest = toNumber(pickFirst(row, ['nintpmnt', 'Interest', 'interest', 'InterestAmount', 'interestAmount']));
    const beginningBalance = toNumber(pickFirst(row, ['nbegbal', 'BeginningBalance', 'BeginingBalance', 'beginningBalance', 'beginingBalance', 'OpeningBalance', 'openingBalance']));
    const endingBalance = toNumber(pickFirst(row, ['nendbal', 'EndingBalance', 'endingBalance', 'ClosingBalance', 'closingBalance', 'OutstandingBalance', 'outstandingBalance']));
    const serial = toNumber(pickFirst(row, ['norder'])) || (index + 1);

    return {
      serial,
      date: formatDate(pickFirst(row, ['Expr1', 'Date', 'date', 'PaymentDate', 'paymentDate', 'DueDate', 'dueDate'])),
      periodicPayment,
      principal,
      interest,
      beginningBalance,
      endingBalance,
    };
  });

  const totals = scheduleRows.reduce((acc, row) => ({
    periodicPayment: acc.periodicPayment + row.periodicPayment,
    principal: acc.principal + row.principal,
    interest: acc.interest + row.interest,
    beginningBalance: acc.beginningBalance + row.beginningBalance,
    endingBalance: acc.endingBalance + row.endingBalance,
  }), {
    periodicPayment: 0,
    principal: 0,
    interest: 0,
    beginningBalance: 0,
    endingBalance: 0,
  });

  const summaryCard = (items) => items.map((item) => `
    <div class="summary-row">
      <div class="summary-label">${escapeHtml(item.label)}</div>
      <div class="summary-value">${escapeHtml(item.value)}</div>
    </div>
  `).join('');

  const tableBody = scheduleRows.length > 0
    ? scheduleRows.map((row) => `
      <tr>
        <td class="num">${row.serial}</td>
        <td>${escapeHtml(row.date)}</td>
        <td class="amt">${formatAmount(row.periodicPayment)}</td>
        <td class="amt">${formatAmount(row.principal)}</td>
        <td class="amt">${formatAmount(row.interest)}</td>
        <td class="amt">${formatAmount(row.beginningBalance)}</td>
        <td class="amt">${formatAmount(row.endingBalance)}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="7" class="no-data">No schedule data found.</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Loan Schedule</title>
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
          max-width: 1120px;
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
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .summary-card {
          border: 1px solid var(--line);
          border-radius: 6px;
          overflow: hidden;
        }
        .summary-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          padding: 7px 10px;
          border-bottom: 1px solid var(--line);
          font-size: 12.5px;
        }
        .summary-row:last-child {
          border-bottom: 0;
        }
        .summary-label {
          color: var(--muted);
          font-weight: 600;
        }
        .summary-value {
          text-align: right;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          word-break: break-word;
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
          width: 54px;
          text-align: center;
          white-space: nowrap;
        }
        .amt {
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .no-data {
          text-align: center;
          color: var(--muted);
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
          <div class="title">Loan Schedule</div>
          <div class="sub-title">Customer Code: ${escapeHtml(context.customerCode || '')} | Account Number: ${escapeHtml(context.accountNumber || '')}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">${summaryCard(summaryLeft)}</div>
          <div class="summary-card">${summaryCard(summaryRight)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Periodic Payment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Beginning Balance</th>
              <th>Ending Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableBody}
          </tbody>
          <tfoot>
            <tr>
              <td class="num"></td>
              <td>Total</td>
              <td class="amt">${formatAmount(totals.periodicPayment)}</td>
              <td class="amt">${formatAmount(totals.principal)}</td>
              <td class="amt">${formatAmount(totals.interest)}</td>
              <td class="amt">${formatAmount(totals.beginningBalance)}</td>
              <td class="amt">${formatAmount(totals.endingBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;
};