import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'

// Journal Post API Plugin (dev server middleware, backend only)
const journalPostApiPlugin = () => ({
  name: 'journal-post-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/journal/postjournal', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward POST to backend only
        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/journal/postjournal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process journal post.' }))
      }
    })
  },
})

// Loan Report API Plugin (dev server middleware, backend only)
const loanReportApiPlugin = () => ({
  name: 'loan-report-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan-report/report', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/loan-report/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process loan report request.', error: err.message }))
      }
    })
  },
})

// Account Details API Plugin (dev server middleware, backend only)
const accountDetailsApiPlugin = () => ({
  name: 'account-details-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/account/details/:accountNumber', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend only
        if (req.method === 'GET') {
          const accountNumber = req.url.split('/').pop()
          try {
            const backendRes = await fetch(`https://alakuyateh-001-site10.atempurl.com/api/account/details/${accountNumber}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to fetch account details.' }))
      }
    })
  },
})

// ID Types API Plugin (dev server middleware) - forwards to backend lookup for id types
const idTypesApiPlugin = () => ({
  name: 'id-types-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/remote-id-types', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/lookups/idtypes', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to fetch id types.' }))
      }
    })
  },
})

// The atempurl.com host redirects HTTP to HTTPS but uses a certificate whose
// common-name doesn't match.  Disabling TLS verification here is safe because
// this only affects the Vite dev-server proxy, not production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const depositsFilePath = path.resolve(process.cwd(), 'src/data/deposits.json')
const withdrawalsFilePath = path.resolve(process.cwd(), 'src/data/withdrawals.json')
const loanRepaymentsFilePath = path.resolve(process.cwd(), 'src/data/loan-repayments.json')
const userSetupFilePath = path.resolve(process.cwd(), 'src/data/user-setup.json')
const securitySettingsFilePath = path.resolve(process.cwd(), 'src/data/security-settings.json')
const productDefinitionFilePath = path.resolve(process.cwd(), 'src/data/product-definition.json')
const periodicProcessingFilePath = path.resolve(process.cwd(), 'src/data/periodic-processing.json')
const customerRegistrationFilePath = path.resolve(process.cwd(), 'src/data/customer-registration.json')
const loginAttemptsFilePath = path.resolve(process.cwd(), 'src/data/login-attempts.json')

const parseRequestBody = async (req) => {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  const bodyText = Buffer.concat(chunks).toString('utf8')
  return bodyText ? JSON.parse(bodyText) : {}
}

const readDepositsFile = async () => {
  try {
    const raw = await fs.readFile(depositsFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const writeDepositsFile = async (rows) => {
  const payload = JSON.stringify({ rows }, null, 2)
  await fs.writeFile(depositsFilePath, payload, 'utf8')
}

const readWithdrawalsFile = async () => {
  try {
    const raw = await fs.readFile(withdrawalsFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const writeWithdrawalsFile = async (rows) => {
  const payload = JSON.stringify({ rows }, null, 2)
  await fs.writeFile(withdrawalsFilePath, payload, 'utf8')
}

const readLoanRepaymentsFile = async () => {
  try {
    const raw = await fs.readFile(loanRepaymentsFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const writeLoanRepaymentsFile = async (rows) => {
  const payload = JSON.stringify({ rows }, null, 2)
  await fs.writeFile(loanRepaymentsFilePath, payload, 'utf8')
}

const readUserSetupFile = async () => {
  try {
    const raw = await fs.readFile(userSetupFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    const companyBranches = Array.isArray(parsed?.companyBranches)
      ? parsed.companyBranches.filter((item) => item && item.companyName && item.branchName)
      : []

    const branchesFromLinks = companyBranches.map((item) => item.branchName)
    const branchList = Array.from(new Set([
      ...(Array.isArray(parsed?.branches) ? parsed.branches : []),
      ...branchesFromLinks,
    ]))

    return {
      companies: Array.isArray(parsed?.companies) ? parsed.companies : [],
      branches: branchList,
      companyBranches,
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      roles: Array.isArray(parsed?.roles) ? parsed.roles : [],
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { companies: [], branches: [], companyBranches: [], users: [], roles: [] }
    }
    throw error
  }
}

const writeUserSetupFile = async (data) => {
  const payload = JSON.stringify(data, null, 2)
  await fs.writeFile(userSetupFilePath, payload, 'utf8')
}

const readSecuritySettingsFile = async () => {
  try {
    const raw = await fs.readFile(securitySettingsFilePath, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      settings: parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
      departmentAuthorisers: Array.isArray(parsed?.departmentAuthorisers) ? parsed.departmentAuthorisers : [],
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { settings: {}, departmentAuthorisers: [] }
    }
    throw error
  }
}

const writeSecuritySettingsFile = async (data) => {
  const payload = JSON.stringify(data, null, 2)
  await fs.writeFile(securitySettingsFilePath, payload, 'utf8')
}

const readProductDefinitionFile = async () => {
  try {
    const raw = await fs.readFile(productDefinitionFilePath, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      mainCategories: Array.isArray(parsed?.mainCategories) ? parsed.mainCategories : [],
      productNames: Array.isArray(parsed?.productNames) ? parsed.productNames : [],
      products: Array.isArray(parsed?.products) ? parsed.products : [],
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { mainCategories: [], productNames: [], products: [] }
    }
    throw error
  }
}

const writeProductDefinitionFile = async (data) => {
  const payload = JSON.stringify(data, null, 2)
  await fs.writeFile(productDefinitionFilePath, payload, 'utf8')
}

const readPeriodicProcessingFile = async () => {
  try {
    const raw = await fs.readFile(periodicProcessingFilePath, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      subscriptionRows: Array.isArray(parsed?.subscriptionRows) ? parsed.subscriptionRows : [],
      interestRows: Array.isArray(parsed?.interestRows) ? parsed.interestRows : [],
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { subscriptionRows: [], interestRows: [] }
    }
    throw error
  }
}

const writePeriodicProcessingFile = async (data) => {
  const payload = JSON.stringify(data, null, 2)
  await fs.writeFile(periodicProcessingFilePath, payload, 'utf8')
}

const readCustomerRegistrationFile = async () => {
  try {
    const raw = await fs.readFile(customerRegistrationFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const writeCustomerRegistrationFile = async (rows) => {
  const payload = JSON.stringify({ rows }, null, 2)
  await fs.writeFile(customerRegistrationFilePath, payload, 'utf8')
}

const readLoginAttemptsFile = async () => {
  try {
    const raw = await fs.readFile(loginAttemptsFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

const writeLoginAttemptsFile = async (rows) => {
  const payload = JSON.stringify({ rows }, null, 2)
  await fs.writeFile(loginAttemptsFilePath, payload, 'utf8')
}

const memberActivatePlugin = () => ({
  name: 'member-activate-plugin',
  configureServer(server) {
    server.middlewares.use('/api/update-customer-authorisation', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/Member4Activate/UpdateCustomerAuthorisation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await backendRes.text()
          res.statusCode = backendRes.status
          res.end(data)
          return
        }

        next()
      } catch (err) {
        console.error('Member activate plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error' }))
      }
    })
  },
})

const depositsApiPlugin = () => ({
  name: 'deposits-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/Deposits/DepositUser', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        // Forward POST to backend
        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/Deposits/DepositUser', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch {
            // Backend unreachable — fall back to local storage
            if (!body || typeof body !== 'object') {
              res.statusCode = 400
              res.end(JSON.stringify({ message: 'Invalid payload.' }))
              return
            }
            const rows = await readDepositsFile()
            rows.push(body)
            await writeDepositsFile(rows)
            res.statusCode = 201
            res.end(JSON.stringify({ rows }))
          }
          return
        }

        if (req.method === 'GET') {
          const rows = await readDepositsFile()
          res.statusCode = 200
          res.end(JSON.stringify({ rows }))
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process deposits data.' }))
      }
    })
  },
})

// GL Transactions API Plugin (dev server middleware, backend only)
const glTransactionsApiPlugin = () => ({
  name: 'gl-transactions-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/GLTransactions/transactions', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend
        if (req.method === 'GET') {
          // Preserve the full path and query string
          const fullPath = req.url.startsWith('/api/GLTransactions/transactions') ? req.url : `/api/GLTransactions/transactions${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process GL transactions data.', error: err.message }))
      }
    })
  },
})

// Loan Repayment Insert API Plugin (dev server middleware, backend only)
const loanRepaymentInsertApiPlugin = () => ({
  name: 'loan-repayment-insert-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loanRepayment/InsertLoanRepayment', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward POST to backend
        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/loanRepayment/InsertLoanRepayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process loan repayment insert.' }))
      }
    })
  },
})

const loanRepaymentAccountApiPlugin = () => ({
  name: 'loan-repayment-account-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/LoanRepayment/getLoanRepaymentAccount', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend
        if (req.method === 'GET') {
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com/api/LoanRepayment/getLoanRepaymentAccount${req.url.replace('/api/LoanRepayment/getLoanRepaymentAccount', '')}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process loan repayment account data.' }))
      }
    })
  },
})

const remoteMemberValidateApiPlugin = () => ({
  name: 'remote-member-validate-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/remote-member-validate', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend
        if (req.method === 'GET') {
          // Forward query string as-is
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com/api/members/validate${req.url.replace('/api/remote-member-validate', '')}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process remote member validate.' }))
      }
    })
  },
})

const withdrawalsApiPlugin = () => ({
  name: 'withdrawals-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/Withdrawals/WithdrawalUser', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        // Forward POST to backend
        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/Withdrawals/WithdrawalUser', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch {
            // Backend unreachable — fall back to local storage
            if (!body || typeof body !== 'object') {
              res.statusCode = 400
              res.end(JSON.stringify({ message: 'Invalid payload.' }))
              return
            }
            const rows = await readWithdrawalsFile()
            rows.push(body)
            await writeWithdrawalsFile(rows)
            res.statusCode = 201
            res.end(JSON.stringify({ rows }))
          }
          return
        }

        if (req.method === 'GET') {
          const rows = await readWithdrawalsFile()
          res.statusCode = 200
          res.end(JSON.stringify({ rows }))
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process withdrawal data.' }))
      }
    })
  },
})

const loanRepaymentsApiPlugin = () => ({
  name: 'loan-repayments-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan-repayments', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const rows = await readLoanRepaymentsFile()
          res.statusCode = 200
          res.end(JSON.stringify({ rows }))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const incomingRow = body?.row

          if (!incomingRow || typeof incomingRow !== 'object') {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected row object.' }))
            return
          }

          const rows = await readLoanRepaymentsFile()
          rows.push(incomingRow)
          await writeLoanRepaymentsFile(rows)

          res.statusCode = 201
          res.end(JSON.stringify({ rows }))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process loan repayments data.' }))
      }
    })
  },
})

const userSetupApiPlugin = () => ({
  name: 'user-setup-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/changepassword/update', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/changepassword/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to change password.' }))
      }
    })

    server.middlewares.use('/api/user-setup/password-change', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const userId = String(body?.userId || '').trim()
          const currentPassword = String(body?.currentPassword || '')
          const newPassword = String(body?.newPassword || '')

          if (!userId || !currentPassword || !newPassword) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Missing required fields.' }))
            return
          }

          if (newPassword.length < 8) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'New password must be at least 8 characters.' }))
            return
          }

          const existing = await readUserSetupFile()
          const users = [...(existing.users || [])]
          const userIndex = users.findIndex((item) => item?.userId === userId)

          if (userIndex < 0) {
            res.statusCode = 404
            res.end(JSON.stringify({ message: 'User not found.' }))
            return
          }

          const userRecord = users[userIndex]
          const matchesCurrent = userRecord?.temporaryPassword === currentPassword || userRecord?.password === currentPassword

          if (!matchesCurrent) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Current password is incorrect.' }))
            return
          }

          if (userRecord?.disableUser) {
            res.statusCode = 403
            res.end(JSON.stringify({ message: 'User account is disabled.' }))
            return
          }

          users[userIndex] = {
            ...userRecord,
            password: newPassword,
            temporaryPassword: '',
            resetPassword: false,
            passwordUpdatedAt: new Date().toISOString(),
          }

          const nextPayload = {
            companies: existing.companies || [],
            branches: existing.branches || [],
            companyBranches: existing.companyBranches || [],
            users,
            roles: existing.roles || [],
          }

          await writeUserSetupFile(nextPayload)

          res.statusCode = 200
          res.end(JSON.stringify({ message: 'Password changed successfully.' }))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to change password.' }))
      }
    })

    server.middlewares.use('/api/user-setup', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const data = await readUserSetupFile()
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const userEntry = body?.user
          const roleEntry = body?.role

          const hasValidUser = userEntry && typeof userEntry === 'object'
          const hasValidRole = roleEntry && typeof roleEntry === 'object'

          if (!hasValidUser && !hasValidRole) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected user or role object.' }))
            return
          }

          const existing = await readUserSetupFile()

          const companies = Array.from(new Set([...(existing.companies || []), ...(body?.companies || [])]))
          const incomingCompanyBranches = Array.isArray(body?.companyBranches)
            ? body.companyBranches.filter((item) => item && item.companyName && item.branchName)
            : []

          const companyBranchMap = new Map()
          ;[...(existing.companyBranches || []), ...incomingCompanyBranches].forEach((item) => {
            companyBranchMap.set(`${item.companyName}::${item.branchName}`, item)
          })
          const companyBranches = Array.from(companyBranchMap.values())

          const linkedBranchNames = companyBranches.map((item) => item.branchName)
          const branches = Array.from(new Set([
            ...(existing.branches || []),
            ...(body?.branches || []),
            ...linkedBranchNames,
          ]))

          const users = [...(existing.users || [])]
          if (hasValidUser) {
            const existingUserIndex = users.findIndex((item) => item?.userId && item.userId === userEntry.userId)
            if (existingUserIndex >= 0) {
              users[existingUserIndex] = {
                ...users[existingUserIndex],
                ...userEntry,
              }
            } else {
              users.push(userEntry)
            }
          }

          const roles = [...(existing.roles || [])]
          if (hasValidRole) {
            const existingRoleIndex = roles.findIndex((item) => item?.roleName && item.roleName === roleEntry.roleName)
            if (existingRoleIndex >= 0) {
              roles[existingRoleIndex] = {
                ...roles[existingRoleIndex],
                ...roleEntry,
              }
            } else {
              roles.push(roleEntry)
            }
          }

          const nextPayload = {
            companies,
            branches,
            companyBranches,
            users,
            roles,
          }

          await writeUserSetupFile(nextPayload)

          res.statusCode = 201
          res.end(JSON.stringify(nextPayload))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process user setup data.' }))
      }
    })
  },
})

const securitySettingsApiPlugin = () => ({
  name: 'security-settings-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/security-settings', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const data = await readSecuritySettingsFile()
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const incomingSettings = body?.settings
          const incomingAuthoriser = body?.authoriser

          const hasSettings = incomingSettings && typeof incomingSettings === 'object'
          const hasAuthoriser = incomingAuthoriser && typeof incomingAuthoriser === 'object'

          if (!hasSettings && !hasAuthoriser) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected settings or authoriser object.' }))
            return
          }

          const existing = await readSecuritySettingsFile()

          const settings = hasSettings
            ? {
                ...(existing.settings || {}),
                ...incomingSettings,
              }
            : { ...(existing.settings || {}) }

          const departmentAuthorisers = [...(existing.departmentAuthorisers || [])]
          if (hasAuthoriser) {
            const department = incomingAuthoriser.department
            const existingIndex = departmentAuthorisers.findIndex((item) => item?.department === department)
            if (existingIndex >= 0) {
              departmentAuthorisers[existingIndex] = {
                ...departmentAuthorisers[existingIndex],
                ...incomingAuthoriser,
              }
            } else {
              departmentAuthorisers.push(incomingAuthoriser)
            }
          }

          const nextPayload = {
            settings,
            departmentAuthorisers,
          }

          await writeSecuritySettingsFile(nextPayload)
          res.statusCode = 201
          res.end(JSON.stringify(nextPayload))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process security settings data.' }))
      }
    })
  },
})

const productDefinitionApiPlugin = () => ({
  name: 'product-definition-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/product-definition', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const data = await readProductDefinitionFile()
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const incomingProduct = body?.product

          if (!incomingProduct || typeof incomingProduct !== 'object') {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected product object.' }))
            return
          }

          const existing = await readProductDefinitionFile()

          const mainCategories = Array.from(new Set([
            ...(existing.mainCategories || []),
            ...(Array.isArray(body?.mainCategories) ? body.mainCategories : []),
          ]))

          const productNames = Array.from(new Set([
            ...(existing.productNames || []),
            ...(Array.isArray(body?.productNames) ? body.productNames : []),
          ]))

          const products = [...(existing.products || [])]
          const incomingKey = incomingProduct.id || incomingProduct.productName
          const existingIndex = products.findIndex((item) => (item.id || item.productName) === incomingKey)

          if (existingIndex >= 0) {
            products[existingIndex] = {
              ...products[existingIndex],
              ...incomingProduct,
            }
          } else {
            products.push(incomingProduct)
          }

          const nextPayload = {
            mainCategories,
            productNames,
            products,
          }

          await writeProductDefinitionFile(nextPayload)
          res.statusCode = 201
          res.end(JSON.stringify(nextPayload))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process product definition data.' }))
      }
    })
  },
})

const periodicProcessingApiPlugin = () => ({
  name: 'periodic-processing-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/periodic-processing', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const data = await readPeriodicProcessingFile()
          res.statusCode = 200
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const incomingSubscriptionRow = body?.subscriptionRow
          const incomingInterestRow = body?.interestRow

          const hasSubscriptionRow = incomingSubscriptionRow && typeof incomingSubscriptionRow === 'object'
          const hasInterestRow = incomingInterestRow && typeof incomingInterestRow === 'object'

          if (!hasSubscriptionRow && !hasInterestRow) {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected subscriptionRow or interestRow object.' }))
            return
          }

          const existing = await readPeriodicProcessingFile()

          const subscriptionRows = [...(existing.subscriptionRows || [])]
          if (hasSubscriptionRow) {
            subscriptionRows.push(incomingSubscriptionRow)
          }

          const interestRows = [...(existing.interestRows || [])]
          if (hasInterestRow) {
            interestRows.push(incomingInterestRow)
          }

          const nextPayload = {
            subscriptionRows,
            interestRows,
          }

          await writePeriodicProcessingFile(nextPayload)
          res.statusCode = 201
          res.end(JSON.stringify(nextPayload))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process periodic processing data.' }))
      }
    })
  },
})

const customerRegistrationApiPlugin = () => ({
  name: 'customer-registration-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/customer-registration', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET' && req.url?.startsWith('/report')) {
          const rows = await readCustomerRegistrationFile()
          const latest = rows.length > 0 ? rows[rows.length - 1] : null
          const report = {
            generatedAt: new Date().toISOString(),
            totalRecords: rows.length,
            latestMember: latest
              ? {
                  memberCode: latest.memberCode || '',
                  fullName: [latest.firstName, latest.middleName, latest.surname].filter(Boolean).join(' '),
                  branch: latest.branch || '',
                  creditUnion: latest.creditUnion || '',
                }
              : null,
          }

          res.statusCode = 200
          res.end(JSON.stringify({ report, rows }))
          return
        }

        if (req.method === 'GET') {
          const rows = await readCustomerRegistrationFile()
          res.statusCode = 200
          res.end(JSON.stringify({ rows }))
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          const incomingRow = body?.row

          if (!incomingRow || typeof incomingRow !== 'object') {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload. Expected row object.' }))
            return
          }

          const rows = await readCustomerRegistrationFile()
          rows.push(incomingRow)
          await writeCustomerRegistrationFile(rows)

          res.statusCode = 201
          res.end(JSON.stringify({ rows }))
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process customer registration data.' }))
      }
    })
  },
})

const guarantorLoadApiPlugin = () => ({
  name: 'guarantor-load-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/guarantor/', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          try {
            // Preserve the full path and query string
            const fullPath = req.url.startsWith('/api/guarantor') ? req.url : `/api/guarantor${req.url}`
            const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
            console.log('Guarantor API Request:', backendUrl)
            
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            console.log('Guarantor API Response:', backendRes.status)
            res.statusCode = backendRes.status
            res.end(data)
          } catch (fetchErr) {
            // Backend unreachable
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Guarantor load plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

// Remote Member Details API Plugin (dev server middleware, backend only)
const remoteMemberDetailsApiPlugin = () => ({
  name: 'remote-member-details-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/remote-member-details', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend
        if (req.method === 'GET') {
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com/api/getmemberdetails${req.url.replace('/api/remote-member-details', '')}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process remote member details.' }))
      }
    })
  },
})

// Direct Get Member Details API Plugin (dev server middleware)
const getMemberDetailsApiPlugin = () => ({
  name: 'get-member-details-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/getmemberdetails', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          // Preserve path and query after /api/getmemberdetails
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com/api/getmemberdetails${req.url.replace('/api/getmemberdetails', '')}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process getmemberdetails.' }))
      }
    })
  },
})

// Direct Get Member (institution) API Plugin (dev server middleware)
const getMemberApiPlugin = () => ({
  name: 'get-member-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/getmember', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          // Preserve path and query after /api/getmember
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com/api/getmember${req.url.replace('/api/getmember', '')}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process getmember.' }))
      }
    })
  },
})

// Update Member Details API Plugin (dev server middleware)
const updateMemberDetailsApiPlugin = () => ({
  name: 'update-member-details-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/UpdateMemberDeatails/update', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          // Read body
          let body = ''
          req.on('data', (chunk) => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/UpdateMemberDeatails/update'
              const backendRes = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
              })
              const data = await backendRes.text()
              res.statusCode = backendRes.status
              res.end(data)
            } catch (err) {
              res.statusCode = 502
              res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
            }
          })
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process update member details.' }))
      }
    })
  },
})

// Update Institution Member API Plugin (dev server middleware)
const updateInstitutionApiPlugin = () => ({
  name: 'update-institution-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/member/updateInstitutionMember', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'PUT') {
          // Read body
          let body = ''
          req.on('data', (chunk) => { body += chunk.toString() })
          req.on('end', async () => {
            try {
              const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/member/updateInstitutionMember'
              const backendRes = await fetch(backendUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: body,
              })
              const data = await backendRes.text()
              res.statusCode = backendRes.status
              res.end(data)
            } catch (err) {
              res.statusCode = 502
              res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
            }
          })
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process updateInstitutionMember.' }))
      }
    })
  },
})

const saveLoanGuarantorApiPlugin = () => ({
  name: 'save-loan-guarantor-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan/save-guarantor', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'POST') {
          try {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/loan/save-guarantor'
                console.log('Save Guarantor API Request:', backendUrl)
                console.log('Payload:', body)
                
                const backendRes = await fetch(backendUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: body,
                })
                const data = await backendRes.text()
                console.log('Save Guarantor API Response:', backendRes.status)
                res.statusCode = backendRes.status
                res.end(data)
              } catch (fetchErr) {
                console.error('Backend error:', fetchErr)
                res.statusCode = 502
                res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
              }
            })
          } catch (fetchErr) {
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Save loan guarantor plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const guaranteeHistoryApiPlugin = () => ({
  name: 'guarantee-history-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/GuaranteeHistorySoFar/', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          try {
            // Preserve the full path and query string
            const fullPath = req.url.startsWith('/api/GuaranteeHistorySoFar') ? req.url : `/api/GuaranteeHistorySoFar${req.url}`
            const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
            console.log('Guarantee History API Request:', backendUrl)
            
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            console.log('Guarantee History API Response:', backendRes.status)
            res.statusCode = backendRes.status
            res.end(data)
          } catch (fetchErr) {
            // Backend unreachable
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Guarantee history plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanApprovalApiPlugin = () => ({
  name: 'loan-approval-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/LoanApproval/', async (req, res, next) => {
      try {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          try {
            // Preserve the full path and query string
            const fullPath = req.url.startsWith('/api/LoanApproval') ? req.url : `/api/LoanApproval${req.url}`
            const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
            console.log('Loan Approval API Request:', backendUrl)
            
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            console.log('Loan Approval API Response:', backendRes.status)
            res.statusCode = backendRes.status
            res.end(data)
          } catch (fetchErr) {
            // Backend unreachable
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Loan approval plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanDisbursementApiPlugin = () => ({
  name: 'loan-disbursement-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan-disbursement/', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          try {
            const fullPath = req.url.startsWith('/api/loan-disbursement') ? req.url : `/api/loan-disbursement${req.url}`
            const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
            console.log('Loan Disbursement API Request:', backendUrl)
            
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            console.log('Loan Disbursement API Response:', backendRes.status)
            res.statusCode = backendRes.status
            res.end(data)
          } catch (fetchErr) {
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Loan disbursement plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanDisburseApiPlugin = () => ({
  name: 'loan-disburse-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan/disburse', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'POST') {
          try {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            
            req.on('end', async () => {
              try {
                const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/loan/disburse'
                
                const backendRes = await fetch(backendUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: body,
                })
                const data = await backendRes.text()
                res.statusCode = backendRes.status
                res.end(data)
              } catch (fetchErr) {
                console.error('Backend error:', fetchErr)
                res.statusCode = 502
                res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
              }
            })
          } catch (fetchErr) {
            console.error('Backend error:', fetchErr)
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Loan disburse plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

// Loan Officers API Plugin (dev server middleware, backend only)
const loanOfficersApiPlugin = () => ({
  name: 'loan-officers-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loanbalances/loanofficers', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend only
        if (req.method === 'GET') {
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/loanbalances/loanofficers', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to fetch loan officers.' }))
      }
    })
  },
})

// Users API Plugin (dev server middleware, backend only)
const usersApiPlugin = () => ({
  name: 'users-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/users/list', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Forward GET to backend only
        if (req.method === 'GET') {
          try {
            const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/users/list', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to fetch users.' }))
      }
    })
  },
})

const trialBalanceApiPlugin = () => ({
  name: 'trial-balance-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/trialbalance', async (req, res, next) => {
      try {
        console.log('Trial Balance API Request:', req.method, req.url)
        
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          try {
            const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/trialbalance/get'
            
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })

            req.on('end', async () => {
              try {
                console.log('Trial Balance Request Body:', body)
                console.log('Backend URL:', backendUrl)
                
                const backendRes = await fetch(backendUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: body,
                })
                const data = await backendRes.text()
                console.log('Trial Balance API Response Status:', backendRes.status)
                console.log('Trial Balance API Response Data:', data)
                
                res.statusCode = backendRes.status
                res.end(data)
              } catch (fetchErr) {
                console.error('Backend Fetch Error:', fetchErr)
                res.statusCode = 502
                res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
              }
            })
          } catch (err) {
            console.error('Trial Balance API error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        console.error('Trial Balance plugin error:', err)
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const incomeStatementApiPlugin = () => ({
  name: 'income-statement-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/incomestatement', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/incomestatement/get'
          let body = ''

          req.on('data', (chunk) => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            try {
              const backendRes = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
              })

              const data = await backendRes.text()
              res.statusCode = backendRes.status
              res.end(data)
            } catch (fetchErr) {
              res.statusCode = 502
              res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
            }
          })
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const balanceSheetApiPlugin = () => ({
  name: 'balance-sheet-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/balancesheet', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/balancesheet/get'
          let body = ''

          req.on('data', (chunk) => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            try {
              const backendRes = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
              })

              const data = await backendRes.text()
              res.statusCode = backendRes.status
              res.end(data)
            } catch (fetchErr) {
              res.statusCode = 502
              res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
            }
          })
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanAgingApiPlugin = () => ({
  name: 'loan-aging-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loanaging', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          const fullPath = req.url.startsWith('/api/loanaging') ? req.url : `/api/loanaging${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        if (req.method === 'POST') {
          const fullPath = req.url.startsWith('/api/loanaging') ? req.url : `/api/loanaging${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanProvisionApiPlugin = () => ({
  name: 'loan-provision-api-plugin',
  configureServer(server) {
    // Handles loan provision summary/details GET endpoints via /api/loanprovision/*
    server.middlewares.use('/api/loanprovision', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          const fullPath = req.url.startsWith('/api/loanprovision') ? req.url : `/api/loanprovision${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanBalanceApiPlugin = () => ({
  name: 'loan-balance-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loanbalances', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const fullPath = req.url.startsWith('/api/loanbalances') ? req.url : `/api/loanbalances${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const loanScheduleApiPlugin = () => ({
  name: 'loan-schedule-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loanschedule', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const backendUrl = 'https://alakuyateh-001-site10.atempurl.com/api/loanschedule/get'
          let body = ''

          req.on('data', (chunk) => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            try {
              const backendRes = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
              })

              const data = await backendRes.text()
              res.statusCode = backendRes.status
              res.end(data)
            } catch (fetchErr) {
              res.statusCode = 502
              res.end(JSON.stringify({ message: 'Backend service unavailable', error: fetchErr.message }))
            }
          })
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const transactionListingApiPlugin = () => ({
  name: 'transaction-listing-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/transactionlisting', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          const fullPath = req.url.startsWith('/api/transactionlisting') ? req.url : `/api/transactionlisting${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        if (req.method === 'POST') {
          const fullPath = req.url.startsWith('/api/transactionlisting') ? req.url : `/api/transactionlisting${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

const memberReportApiPlugin = () => ({
  name: 'member-report-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/memberreport', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          const fullPath = req.url.startsWith('/api/memberreport') ? req.url : `/api/memberreport${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        if (req.method === 'POST') {
          const fullPath = req.url.startsWith('/api/memberreport') ? req.url : `/api/memberreport${req.url}`
          const backendUrl = `https://alakuyateh-001-site10.atempurl.com${fullPath}`
          const body = await parseRequestBody(req)
          try {
            const backendRes = await fetch(backendUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            const data = await backendRes.text()
            res.statusCode = backendRes.status
            res.end(data)
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ message: 'Backend service unavailable', error: err.message }))
          }
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Internal server error', error: err.message }))
      }
    })
  },
})

// Dev middleware: persist login attempts to local JSON file
const loginAttemptsApiPlugin = () => ({
  name: 'login-attempts-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/system/login-attempts', async (req, res, next) => {
      try {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          const body = await parseRequestBody(req)
          if (!body || typeof body !== 'object') {
            res.statusCode = 400
            res.end(JSON.stringify({ message: 'Invalid payload.' }))
            return
          }

          const rows = await readLoginAttemptsFile()
          rows.push(body)
          await writeLoginAttemptsFile(rows)
          res.statusCode = 201
          res.end(JSON.stringify({ rows }))
          return
        }

        if (req.method === 'GET') {
          const rows = await readLoginAttemptsFile()
          res.statusCode = 200
          res.end(JSON.stringify({ items: rows }))
          return
        }

        next()
      } catch (err) {
        res.statusCode = 500
        res.end(JSON.stringify({ message: 'Failed to process login attempts.', error: err.message }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    journalPostApiPlugin(),
  accountDetailsApiPlugin(),
  idTypesApiPlugin(),
    glTransactionsApiPlugin(),
    memberActivatePlugin(),
    depositsApiPlugin(),
    withdrawalsApiPlugin(),
    loanRepaymentsApiPlugin(),
    userSetupApiPlugin(),
    securitySettingsApiPlugin(),
    productDefinitionApiPlugin(),
    loanRepaymentInsertApiPlugin(),
    loanReportApiPlugin(),
    periodicProcessingApiPlugin(),
    customerRegistrationApiPlugin(),
    loginAttemptsApiPlugin(),
    guarantorLoadApiPlugin(),
    saveLoanGuarantorApiPlugin(),
    guaranteeHistoryApiPlugin(),
    loanApprovalApiPlugin(),
    loanDisbursementApiPlugin(),
    loanDisburseApiPlugin(),
    loanOfficersApiPlugin(),
    usersApiPlugin(),
    remoteMemberDetailsApiPlugin(),
    getMemberDetailsApiPlugin(),
    getMemberApiPlugin(),
    updateMemberDetailsApiPlugin(),
    updateInstitutionApiPlugin(),
    remoteMemberValidateApiPlugin(),
    loanRepaymentAccountApiPlugin(),
    trialBalanceApiPlugin(),
    incomeStatementApiPlugin(),
    balanceSheetApiPlugin(),
    loanScheduleApiPlugin(),
    loanAgingApiPlugin(),
    loanProvisionApiPlugin(),
    loanBalanceApiPlugin(),
    transactionListingApiPlugin(),
    memberReportApiPlugin(),
  ],
  server: {
    proxy: {
      // Proxy GL Transactions endpoint to avoid CORS
      '/api/GLTransactions/transactions': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/GLTransactions\/transactions/, '/api/GLTransactions/transactions'),
      },
      // Proxy for lookups (branches, etc.) to avoid CORS
      '/api/lookups': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/lookups/, '/api/lookups'),
      },
      // Proxy for getmember endpoint to avoid CORS
      '/api/getmember': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/getmember/, '/api/getmember'),
      },
      // Proxy dashboard summary to avoid CORS during development
      '/api/dashboard': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/dashboard/, '/api/dashboard'),
      },
      // Proxy remote branches lookup to avoid CORS during development
      '/api/remote-branches': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-branches/, '/api/lookups'),
      },
      '/api/remote-countries': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-countries/, '/api/lookups'),
      },
      '/api/remote-member-details': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-member-details/, '/api/getmemberdetails'),
      },
      '/api/getmemberdetails': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/getmemberdetails/, '/api/getmemberdetails'),
      },
      '/api/member/updateInstitutionMember': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/member\/updateInstitutionMember/, '/api/member/updateInstitutionMember'),
      },
      '/api/UpdateMemberDeatails/update': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/UpdateMemberDeatails\/update/, '/api/UpdateMemberDeatails/update'),
      },
      '/api/remote-member-activate': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const [pathname, search] = path.split('?');
          const rewrittenPath = pathname.replace(/^\/api\/remote-member-activate/, '/api/Member4Activate/GetMember4Activate');
          return search ? `${rewrittenPath}?${search}` : rewrittenPath;
        },
      },
      '/api/remote-member': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-member/, '/api/member'),
      },
      '/api/remote-client': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-client/, '/api/client'),
      },
      '/api/remote-cities': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-cities/, '/api/lookups'),
      },
      // Proxy for loan-report endpoints (products, branches, loan-reasons, users, currencies)
      '/api/loan-report': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/loan-report/, '/api/loan-report'),
      },
      '/api/remote-id-types': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-id-types/, '/api/lookups/idtypes'),
      },
      // Proxy /api/client for get-code endpoint to avoid CORS
      '/api/client': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/client/, '/api/client'),
      },
      // Proxy for institution registration to avoid CORS
      '/api/corporategroupmember': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/corporategroupmember/, '/api/corporategroupmember'),
      },
      // Proxy for journal posting endpoint to avoid CORS/SSL issues
      '/api/journal/postjournal': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/journal\/postjournal/, '/api/journal/postjournal'),
      },
      // Proxy for member create endpoint to avoid CORS
      '/api/member/create': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/member\/create/, '/api/member/create'),
      },
      // Proxy mandatory products lookup for Product Definition main category
      '/api/mandatory-products': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/mandatory-products/, '/api/lookups'),
      },
      // Proxy account details endpoint to avoid CORS
      '/api/account/details': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/account\/details/, '/api/account/details'),
      },
      // Proxy banks endpoint to avoid CORS
      '/api/banks': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/banks/, '/api/banks'),
      },
      // Proxy setup endpoint to avoid CORS
      '/api/setup': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/setup/, '/api/setup'),
      },
      // Proxy auth login endpoint to avoid CORS
      '/api/auth/login': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/auth\/login/, '/api/auth/login'),
      },
      // Proxy auth GetAllUsers endpoint to avoid CORS
      '/api/auth/GetAllUsers': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy deposit and withdrawal transaction endpoints to avoid CORS
      '/api/Cusystem': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/Cusystem/, '/api/Cusystem'),
      },
      // Proxy account transaction endpoints to avoid CORS
      '/api/transaction': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/transaction/, '/api/transaction'),
      },
      // Proxy member activation endpoints to avoid CORS
      '/api/member/activate': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loan products endpoint to avoid CORS
      '/api/products': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loan product select (new loan details) endpoint
      '/api/loanproducts': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loans topup endpoint
      '/api/loans': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loan change off clients endpoint with fixed charge type
      '/api/loan-change-off-clients': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/api/loans/clients?chargeType=1',
      },
      // Proxy loan activate clients endpoint with fixed charge type
      '/api/loan-activate-clients': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/api/loans/clients?chargeType=2',
      },
      // Proxy loan recovery/write-off clients endpoint with fixed charge type
      '/api/loan-recovery-write-off-clients': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/api/loans/clients?chargeType=3',
      },
      // Proxy loan charge-off confirmation endpoint
      '/api/loans/chargeoff': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loan activation confirmation endpoint
      '/api/loans/loanactivate': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loans/writeoff': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loans/update-interest-date': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loan/membersavings': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loan/membershares': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loans/accounts': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/account/details': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/Withdrawal/BadDebt': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/loanRepayment/InsertLoanRepayment': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy loan details endpoint with ncompid fixed to 30
      '/api/loan-details': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const query = path.split('?')[1] || '';
          return `/api/LoansDetails/getLoanDetails?ncompid=30&${query}`;
        },
      },
      // Proxy loan setup details endpoint
      '/api/loan-setup': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      // Proxy member enquiry endpoint to avoid CORS
      '/api/member/enquiry': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/member\/enquiry/, '/api/member/enquiry'),
      },
      // Proxy loan approval endpoint to avoid CORS
      '/api/LoanApproval': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/LoanApproval/, '/api/LoanApproval'),
      },
      // Proxy users endpoint to avoid CORS
      '/api/users': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/users/, '/api/users'),
      },
      // Proxy loan details endpoint to avoid CORS
      '/api/LoansDetails': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/LoansDetails/, '/api/LoansDetails'),
      },
      // Proxy loan approval approve endpoint to avoid CORS
      '/api/loanapproval': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/loanapproval/, '/api/loanapproval'),
      },
      // Proxy loan reject endpoint to avoid CORS
      '/api/loanReject': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/loanReject/, '/api/loanReject'),
      },
      // Proxy loan reasons endpoint to avoid CORS
      '/api/loan-reasons': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/loan-reasons/, '/api/lookups/loanreason'),
      },
      // Proxy unverified journals endpoint to avoid CORS
      '/api/unverified-journals': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/unverified-journals/, '/api/UnverifiedJournal'),
      },
      '/api/verification': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
      '/api/Internaljournalaccounts': {
        target: 'https://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
      },
        // Proxy loan repayment account endpoint to avoid CORS
        '/api/LoanRepayment/getLoanRepaymentAccount': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/LoanRepayment\/getLoanRepaymentAccount/, '/api/LoanRepayment/getLoanRepaymentAccount'),
        },
        // Proxy setup account types endpoint to avoid CORS
        '/api/Setup/accounttypes': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy setup income accounts endpoint to avoid CORS
        '/api/Setup/accounts/income': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy setup expense accounts endpoint to avoid CORS
        '/api/Setup/accounts/expense': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy setup liabilities accounts endpoint to avoid CORS
        '/api/Setup/accounts/liabilities': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy setup assets accounts endpoint to avoid CORS
        '/api/Setup/accounts/assets': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy setup product source endpoint to avoid CORS
        '/api/Setup/productsource': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy group members endpoints to avoid CORS
        '/api/groupmembers': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy product insert endpoint to avoid CORS
        '/api/Product/insert': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy users add endpoint to avoid CORS
        '/api/Users/AddUser': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        '/api/changepassword/update': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
        },
        // Proxy savings balance endpoint to avoid CORS
        '/api/savingsbalances/get': {
          target: 'https://alakuyateh-001-site10.atempurl.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/savingsbalances\/get/, '/api/savingsbalances/get'),
        },
    },
  },
// (duplicate plugins array removed)
})
