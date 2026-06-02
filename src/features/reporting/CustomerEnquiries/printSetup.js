import dayjs from 'dayjs';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeText = (value) => String(value ?? '').trim();

const formatDate = (value) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : normalizeText(value);
};

const formatGender = (row) => {
  const raw = normalizeText(row?.gender || row?.cgender || row?.sex || row?.genderCode);
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper === 'M' || upper === '1' || upper === 'MALE') return 'Male';
  if (upper === 'F' || upper === '2' || upper === 'FEMALE') return 'Female';
  return raw;
};

const customerCodeOf = (row) => normalizeText(
  row?.customercode
  || row?.ccustcode
  || row?.cmemberno
  || row?.memberno
  || row?.memberNo
  || row?.cacctnumb,
);

const customerNameOf = (row) => {
  const first = normalizeText(row?.ccustfname);
  const middle = normalizeText(row?.ccustmname);
  const last = normalizeText(row?.ccustlname);
  const full = [first, middle, last].filter(Boolean).join(' ').trim();
  return full || normalizeText(row?.ccustname || row?.customerName || row?.cacctname);
};

const dateJoinedOf = (row) => (
  formatDate(row?.dateJoined || row?.djoindate || row?.dopendate || row?.dcreatedate)
);

const dateOfBirthOf = (row) => (
  formatDate(row?.dateOfBirth || row?.dob || row?.ddob)
);

const phoneOf = (row) => normalizeText(
  row?.phone
  || row?.telephone
  || row?.mobile
  || row?.tel
  || row?.Expr1,
);

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.Table)) return payload.Table;
  if (Array.isArray(payload?.table)) return payload.table;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.Table)) return payload.data.Table;
  if (Array.isArray(payload?.data?.table)) return payload.data.table;
  return [];
};

export const buildCustomerEnquiriesPrintHtml = (payload) => {
  const safeRows = normalizeRows(payload);
  const firstRow = safeRows[0] ?? {};
  const companyName = normalizeText(firstRow?.com_name) || 'Company';
  const address = normalizeText(firstRow?.caddress);
  const telephone = normalizeText(firstRow?.tel || firstRow?.Expr1);
  const email = normalizeText(firstRow?.email);
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const tableRows = safeRows.map((row) => `
    <tr>
      <td>${escapeHtml(customerCodeOf(row))}</td>
      <td>${escapeHtml(customerNameOf(row))}</td>
      <td>${escapeHtml(dateJoinedOf(row))}</td>
      <td>${escapeHtml(formatGender(row))}</td>
      <td>${escapeHtml(dateOfBirthOf(row))}</td>
      <td>${escapeHtml(phoneOf(row))}</td>
    </tr>
  `).join('');

  const emptyState = `
    <tr>
      <td colspan="6" style="text-align:center; color:#475569; padding: 18px;">No customer records found.</td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Customer Enquiries</title>
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
          max-width: 1100px;
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

        @media print {
          body { padding: 8mm; }
          .report { max-width: none; }
          .meta-right { right: 0; }
          thead { display: table-header-group; }
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
          <div class="title">Customer Enquiries</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Customer Code</th>
              <th>Customer Name</th>
              <th>Date Joined</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || emptyState}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};
