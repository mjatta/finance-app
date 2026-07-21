import React, { useState } from 'react'
import { Box, Card, CardContent, Typography, MenuItem, TextField, Button } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import useAuditTrailTypes from './hooks/useAuditTrailTypes'
import useCreditUnionLookup from '../../../hooks/useCreditUnionLookup'
import buildAuditTrailPrintHtml from './printSetup'
import dayjs from 'dayjs'

export default function AuditTrailReport() {
  const { types, loading: typesLoading } = useAuditTrailTypes()
  const { data: creditUnion } = useCreditUnionLookup()
  const [auditType, setAuditType] = useState('')
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)

  const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''))

  const handleExport = async (type) => {
    try {
      const payload = { AuditType: auditType || '', FromDate: formatDate(fromDate), ToDate: formatDate(toDate) }
      const resp = await fetch('/api/audittrail/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!resp.ok) throw new Error(`Report API ${resp.status}`)
      const json = await resp.json()
      // Try to robustly find an array payload in the response
      const extractRows = (obj) => {
        if (!obj) return []
        if (Array.isArray(obj)) return obj
        const commonKeys = ['data', 'rows', 'items', 'result', 'records']
        for (const k of commonKeys) {
          if (Array.isArray(obj[k])) return obj[k]
        }
        // search nested one level deep
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) return v
        }
        return []
      }

      const rows = extractRows(json)
      console.debug('AuditTrail report response summary:', { count: rows.length, sample: rows[0] })

      if (!rows || rows.length === 0) {
        // show raw response in a new window for debugging instead of producing an empty print
        const w = window.open('', '_blank', 'width=900,height=700')
        if (w) {
          w.document.open()
          w.document.write(`<pre style="white-space:pre-wrap;word-wrap:break-word">${JSON.stringify(json, null, 2)}</pre>`)
          w.document.close()
        }
        alert('Report returned no rows. Opening raw response for inspection.')
        return
      }

      if (type === 'csv' || type === 'excel') {
        const headers = ['Date', 'Time', 'User', 'Type', 'Description', 'OrigValue', 'NewValue', 'Remarks']
        const csvRows = rows.map((r) => [
          r.audit_date ? dayjs(r.audit_date).format('YYYY-MM-DD') : (r.audit_date || ''),
          r.audit_time || '',
          (r.winusr || r.suserid || '').toString().trim(),
          r.audit_type || '',
          (r.audit_desc || '').toString().trim(),
          r.orig_value ?? r.orig_cvalue ?? '',
          r.new_value ?? r.new_cvalue ?? '',
          r.cremarks || '',
        ])
        const csv = [headers, ...csvRows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""') }"`).join(',')).join('\n')
        const name = `audit-trail-${new Date().toISOString().slice(0,10)}.${type === 'excel' ? 'xlsx' : 'csv'}`
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        return
      }

      // PDF / print
      const headerMeta = {
        companyName: creditUnion?.com_name || creditUnion?.CompanyName || '',
        address: creditUnion?.caddress || creditUnion?.address || '',
        telephone: creditUnion?.tel || creditUnion?.telephone || '',
        email: creditUnion?.email || creditUnion?.Email || '',
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
      }
      const html = buildAuditTrailPrintHtml(rows, 'Audit Trail Report', headerMeta)
      const w = window.open('', '_blank', 'width=1000,height=800')
      if (!w) throw new Error('Popup blocked')
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
    } catch (err) {
      console.error(err)
      alert('Failed to export report')
    }
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Audit Trail Report</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>View audit activities and export results</Typography>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label="Audit Type"
              value={auditType}
              onChange={(e) => setAuditType(e.target.value)}
              size="small"
              sx={{ minWidth: 320 }}
            >
              <MenuItem value="">-- select --</MenuItem>
              {types.map((t) => (
                <MenuItem key={t.id ?? t.code} value={t.code ?? t.id}>{String(t.codename || t.code || '').trim()}</MenuItem>
              ))}
            </TextField>

            <DatePicker label="Transaction From" value={fromDate} onChange={(v) => setFromDate(v)} renderInput={(params) => <TextField {...params} size="small" />} />
            <DatePicker label="Transaction To" value={toDate} onChange={(v) => setToDate(v)} renderInput={(params) => <TextField {...params} size="small" />} />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={() => handleExport('pdf')} sx={{ textTransform: 'none' }}>PDF</Button>
              <Button variant="outlined" onClick={() => handleExport('excel')} sx={{ textTransform: 'none' }}>Excel</Button>
              <Button variant="outlined" onClick={() => handleExport('csv')} sx={{ textTransform: 'none' }}>CSV</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
