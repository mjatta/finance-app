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

const formatAmountAbsolute = (value) => {
  const num = toNumber(value) || 0;
  const abs = Math.abs(num);
  return abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : String(value || '');
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

const sortAgingRanges = (a, b) => {
  const extractDaysFrom = (key) => {
    const match = key.match(/^(\d+)-/);
    return match ? parseInt(match[1], 10) : Infinity;
  };
  return extractDaysFrom(a) - extractDaysFrom(b);
};

export const buildDetailedAgingPrintHtml = (payload, reportDate) => {
  const rows = normalizeRows(payload);
  const firstRow = rows[0] ?? {};
  const companyName = String(firstRow?.com_name ?? '').trim() || 'Company';
  const address = String(firstRow?.caddress ?? '').trim();
  const telephone = String(firstRow?.tel ?? '').trim();
  const email = String(firstRow?.email ?? '').trim();
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const reportDateLabel = formatDate(reportDate);

  // If payload is an array of groups (child arrays), render each group as its own table.
  // If payload is a flat array of row objects, group them by `LoanAgeCategory` (fallback
  // to `DaysFrom-DaysTo`) so we render one table per age bucket like the PDF expects.
  let groups = [];
  if (Array.isArray(rows) && rows.length > 0) {
    if (Array.isArray(rows[0])) {
      groups = rows;
    } else if (typeof rows[0] === 'object' && rows[0] !== null) {
      const map = {};
      const order = [];
      rows.forEach((r) => {
        const hasDays = (r?.DaysFrom != null) || (r?.DaysTo != null);
        const key = hasDays
          ? `${r?.DaysFrom ?? 'N/A'}-${r?.DaysTo ?? 'N/A'}`
          : (r?.LoanAgeCategory || 'Ungrouped');
        if (!map[key]) {
          map[key] = [];
          order.push(key);
        }
        map[key].push(r);
      });
      groups = order.map((k) => map[k]);
    } else {
      groups = [rows];
    }
  } else {
    groups = [rows];
  }

  // Sort groups by aging range (0-30 first, then 31-90, 91-180, 181-365, etc.)
  if (Array.isArray(groups) && groups.length > 0 && Array.isArray(groups[0])) {
    const groupWithKeys = groups.map((g) => {
      const first = g[0] ?? {};
      const key = (first?.DaysFrom != null || first?.DaysTo != null)
        ? `${first?.DaysFrom ?? 'N/A'}-${first?.DaysTo ?? 'N/A'}`
        : (first?.LoanAgeCategory || 'Ungrouped');
      return { group: g, key };
    });
    groupWithKeys.sort((a, b) => sortAgingRanges(a.key, b.key));
    groups = groupWithKeys.map((g) => g.group);
  }

  const tablesHtml = groups.map((groupRows) => {
    const safeGroup = Array.isArray(groupRows) ? groupRows : [];
    const first = safeGroup[0] ?? {};
    const groupLabel = (first?.DaysFrom != null || first?.DaysTo != null)
      ? `${first?.DaysFrom ?? 'N/A'}-${first?.DaysTo ?? 'N/A'}`
      : (first?.LoanAgeCategory || '');

    const body = safeGroup.length > 0
      ? safeGroup.map((row) => `
        <tr>
          <td class="num">${escapeHtml(String(row?.cacctnumb ?? '').trim())}</td>
          <td>${escapeHtml(String(row?.cacctname ?? '').trim())}</td>
          <td class="amt">${formatAmountAbsolute(row?.PRINCIPAL_AMT)}</td>
          <td class="amt">${formatAmountAbsolute(row?.nbookbal)}</td>
          <td class="amt">${formatAmountAbsolute(row?.nnewbal)}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="5" class="no-data">No detailed aging data found for this group.</td>
        </tr>
      `;

    const totalPrincipal = safeGroup.reduce((s, r) => s + toNumber(r?.PRINCIPAL_AMT), 0);
    const totalBookBalance = safeGroup.reduce((s, r) => s + toNumber(r?.nbookbal), 0);
    const totalPrepaid = safeGroup.reduce((s, r) => s + toNumber(r?.nnewbal), 0);

    const footerRow = safeGroup.length > 0 ? `
      <tr style="background: #f1f5f9; font-weight: 700;">
        <td class="num"></td>
        <td style="font-weight: 700;">TOTAL</td>
        <td class="amt">${formatAmountAbsolute(totalPrincipal)}</td>
        <td class="amt">${formatAmountAbsolute(totalBookBalance)}</td>
        <td class="amt">${formatAmountAbsolute(totalPrepaid)}</td>
      </tr>
    ` : '';

    // Place the category label inside the table header for a cleaner look (e.g. "0 to 30").
    return `
      <div style="margin-top:18px;">
        <table>
          <thead>
            ${groupLabel ? `<tr class="group-header"><th colspan="5" style="text-align:left; font-weight:700; font-size:14px; padding:8px 10px;">${escapeHtml(String(groupLabel).replace('-', ' to '))}</th></tr>` : ''}
            <tr>
              <th>Account Number</th>
              <th>Account Name</th>
              <th>Amount Issued</th>
              <th>Book Balance</th>
              <th>Prepaid</th>
            </tr>
          </thead>
          <tbody>
            ${body}
            ${footerRow}
          </tbody>
        </table>
      </div>
    `;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Detailed Aging</title>
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
        .header { position: relative; margin-bottom: 6px; text-align: center; }
        .meta-right { position: absolute; right: 0; top: 0; color: var(--muted); font-size: 12px; }
        .company { font-size: 18px; font-weight: 700; margin-top: 6px; }
        .line { font-size: 12px; color: var(--muted); }
        .title { margin-top: 14px; font-size: 19px; font-weight: 700; text-transform: uppercase; }
        .sub-title { margin-top: 2px; font-size: 12px; color: var(--muted); }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12.5px; }
        thead th { background: var(--header-bg); border: 1px solid var(--line); padding: 8px 10px; text-align: left; font-weight: 700; }
        tbody td, tfoot td { border: 1px solid var(--line); padding: 7px 10px; vertical-align: top; }
        tbody tr:nth-child(even) { background: var(--stripe); }
        .num { width: 170px; white-space: nowrap; }
        .amt { width: 150px; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        tfoot td { font-weight: 700; background: #f1f5f9; }
        .no-data { text-align: center; color: var(--muted); }
        @media print { body { padding: 8mm; } .report { max-width: none; } .meta-right { right: 0; } }
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
          <div class="title">Detailed Aging</div>
          <div class="sub-title">To Date: ${escapeHtml(reportDateLabel)}</div>
        </div>

        ${tablesHtml}
      </div>
    </body>
    </html>
  `;
};