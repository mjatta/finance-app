import React, { useState } from 'react'
import { Alert, Backdrop, Box, Card, CardContent, CircularProgress, Typography, MenuItem, TextField, Button } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import useAuditTrailTypes from './hooks/useAuditTrailTypes'
import useCreditUnionLookup from '../../../hooks/useCreditUnionLookup'
import buildAuditTrailPrintHtml from './printSetup'
import dayjs from 'dayjs'

export default function AuditTrailReport() {
  const { types, loading: typesLoading } = useAuditTrailTypes()
  const { data: creditUnion } = useCreditUnionLookup()
  const [auditType, setAuditType] = useState('')
  const [fromDate, setFromDate] = useState(() => dayjs().subtract(30, 'day'))
  const [toDate, setToDate] = useState(() => dayjs())
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState('error')
  const [isExporting, setIsExporting] = useState(false)

  const formatDate = (value) => (value && value.format ? value.format('YYYY-MM-DD') : (value || ''))

  const handleExport = async (type) => {
    setIsExporting(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      const payload = { AuditType: auditType || '', FromDate: formatDate(fromDate), ToDate: formatDate(toDate) }
      const resp = await fetch('/api/audittrail/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal })
      clearTimeout(timeoutId)
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
        setAlertMessage('Report returned no rows. Opening raw response for inspection.')
        setAlertSeverity('warning')
        setAlertOpen(true)
        setIsExporting(false)
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
      return
    } catch (err) {
      console.error(err)
      clearTimeout(timeoutId)
      const message = err?.name === 'AbortError'
        ? 'Request timed out. Please narrow the date range or audit type and try again.'
        : 'Failed to export report'
      setAlertMessage(message)
      setAlertSeverity('error')
      setAlertOpen(true)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop open={isExporting} sx={{ zIndex: 1300 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={72} />
          <Typography variant="h6" sx={{ color: 'white' }}>Preparing export...</Typography>
        </Box>
      </Backdrop>

      {alertOpen && (
        <Alert severity={alertSeverity} onClose={() => setAlertOpen(false)} sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      )}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Audit Trail Report
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          View audit activities and export results.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Audit Type"
              value={auditType}
              onChange={(e) => setAuditType(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">-- select --</MenuItem>
              {types.map((t) => (
                <MenuItem key={t.id ?? t.code} value={t.code ?? t.id}>{String(t.codename || t.code || '').trim()}</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <DatePicker label="Transaction From" value={fromDate} onChange={(v) => setFromDate(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Transaction To" value={toDate} onChange={(v) => setToDate(v)} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#229954' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              sx={{ backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              CSV
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
