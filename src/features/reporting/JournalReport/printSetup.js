import dayjs from 'dayjs'

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatAmount = (value) => {
  const n = Number(value ?? 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (value) => {
  if (!value) return ''
  try {
    return dayjs(value).format('DD-MM-YYYY')
  } catch {
    return String(value)
  }
}

export const buildJournalReportPrintHtml = (items, title = 'Journal Report', meta = {}) => {
  const rows = Array.isArray(items) ? items : []
  const first = rows[0]?.Fields || {}
  const companyName = (first.com_name || '').trim() || meta.companyName || 'Company'
  const address = (first.caddress || '').trim() || ''
  const telephone = (first.tel || '').trim() || ''
  const email = (first.email || '').trim() || ''
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const fromLabel = meta.fromDate || ''
  const toLabel = meta.toDate || ''

  // Group rows by user
  const userGroups = {}
  rows.forEach((r) => {
    const f = r.Fields || {}
    const userId = f.cuserid || 'Unknown'
    if (!userGroups[userId]) {
      userGroups[userId] = []
    }
    userGroups[userId].push(r)
  })

  // Build a table for each user
  const userTables = Object.keys(userGroups).map((userId) => {
    const userRows = userGroups[userId]
    
    const tableRows = userRows.map((r) => {
      const f = r.Fields || {}
      const ntranamnt = Number(f.ntranamnt ?? 0)
      const debitAmount = ntranamnt < 0 ? Math.abs(ntranamnt) : 0
      const creditAmount = ntranamnt > 0 ? ntranamnt : 0
      return `
        <tr>
          <td>${escapeHtml(formatDate(f.dtrandate))}</td>
          <td>${escapeHtml(f.cacctnumb || '')}</td>
          <td>${escapeHtml((f.ctrandesc || '').trim())}</td>
          <td style="text-align:right">${formatAmount(debitAmount)}</td>
          <td style="text-align:right">${formatAmount(creditAmount)}</td>
        </tr>
      `
    }).join('')

    // Calculate totals for this user
    const totalDebit = userRows.reduce((sum, r) => {
      const f = r.Fields || {}
      const ntranamnt = Number(f.ntranamnt ?? 0)
      const debitAmount = ntranamnt < 0 ? Math.abs(ntranamnt) : 0
      return sum + (Number(debitAmount) || 0)
    }, 0)
    const totalCredit = userRows.reduce((sum, r) => {
      const f = r.Fields || {}
      const ntranamnt = Number(f.ntranamnt ?? 0)
      const creditAmount = ntranamnt > 0 ? ntranamnt : 0
      return sum + (Number(creditAmount) || 0)
    }, 0)

    const totalsRow = `
      <tr style="font-weight:700;background:#f1f5f9;border-top:2px solid #0f172a">
        <td colspan="3" style="text-align:right">TOTAL:</td>
        <td style="text-align:right">${formatAmount(totalDebit)}</td>
        <td style="text-align:right">${formatAmount(totalCredit)}</td>
      </tr>
    `

    return `
      <div style="margin-bottom:20px">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#0f172a">User: ${escapeHtml(userId)}</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Description</th>
              <th style="text-align:right">Debit</th>
              <th style="text-align:right">Credit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}${totalsRow}
          </tbody>
        </table>
      </div>
    `
  }).join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    :root{--text:#0f172a;--muted:#475569;--line:#e6eef8;--header-bg:#f1f5f9}
    body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:var(--text);margin:0;padding:20px;background:#fff}
    .report{max-width:1050px;margin:0 auto}
    .header{text-align:center;margin-bottom:12px}
    .meta-right{position:absolute;right:20px;top:20px;font-size:12px;color:var(--muted)}
    .company{font-size:20px;font-weight:800}
    .line{font-size:13px;color:var(--muted);margin:2px 0}
    .title{margin-top:8px;font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
    thead th{background:var(--header-bg);border:1px solid var(--line);padding:8px;text-align:left;font-weight:700}
    tbody td{border:1px solid var(--line);padding:7px;vertical-align:top}
    tbody tr:nth-child(even){background:#fbfdff}
    .amt{text-align:right;font-variant-numeric:tabular-nums}
    @media print{body{padding:8mm}}
  </style></head><body><div class="report"><div class="header"><div class="meta-right">Printed: ${escapeHtml(printedAt)}</div><div class="company">${escapeHtml(companyName)}</div>${address?`<div class="line">${escapeHtml(address)}</div>`:''}${telephone?`<div class="line">Tel: ${escapeHtml(telephone)}</div>`:''}${email?`<div class="line">Email: ${escapeHtml(email)}</div>`:''}<div class="title">${escapeHtml(title)}</div><div class="line">Period: ${escapeHtml(fromLabel)} to ${escapeHtml(toLabel)}</div></div>${userTables}</div></body></html>`
}

export default buildJournalReportPrintHtml
