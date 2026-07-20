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

export const buildBankReconciliationPrintHtml = (items, title = 'Bank Reconciliation Report', meta = {}) => {
  const rows = Array.isArray(items) ? items : []
  const first = rows[0]?.Fields || {}
  const companyName = (first.com_name || '').trim() || meta.companyName || 'Company'
  const address = (first.caddress || '').trim() || meta.address || ''
  const telephone = (first.tel || '').trim() || meta.telephone || ''
  const email = (first.email || '').trim() || meta.email || ''
  const printedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const fromLabel = meta.fromDate || ''
  const toLabel = meta.toDate || ''

  const tableRows = rows.map((r) => {
    const f = r.Fields || r || {}
    const date = f.dtrandate || f.trandate || f.date || ''
    const reference = f.cbankref || f.creference || f.reference || ''
    const desc = (f.cdesc || f.description || f.ctrandesc || '').trim()
    const debit = f.ndebit ?? 0
    const credit = f.ncredit ?? 0
    const balance = f.nbal ?? f.nbalance ?? ''
    return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(reference)}</td>
        <td>${escapeHtml(desc)}</td>
        <td style="text-align:right">${formatAmount(debit)}</td>
        <td style="text-align:right">${formatAmount(credit)}</td>
        <td style="text-align:right">${escapeHtml(balance)}</td>
      </tr>
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
  </style></head><body><div class="report"><div class="header"><div class="meta-right">Printed: ${escapeHtml(printedAt)}</div><div class="company">${escapeHtml(companyName)}</div>${address?`<div class="line">${escapeHtml(address)}</div>`:''}${telephone?`<div class="line">Tel: ${escapeHtml(telephone)}</div>`:''}${email?`<div class="line">Email: ${escapeHtml(email)}</div>`:''}<div class="title">${escapeHtml(title)}</div><div class="line">Period: ${escapeHtml(fromLabel)} to ${escapeHtml(toLabel)}</div></div><table><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead><tbody>${tableRows}</tbody></table></div></body></html>`
}

export default buildBankReconciliationPrintHtml
