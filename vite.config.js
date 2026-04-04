import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'

const depositsFilePath = path.resolve(process.cwd(), 'src/data/deposits.json')
const loanRepaymentsFilePath = path.resolve(process.cwd(), 'src/data/loan-repayments.json')
const userSetupFilePath = path.resolve(process.cwd(), 'src/data/user-setup.json')
const securitySettingsFilePath = path.resolve(process.cwd(), 'src/data/security-settings.json')
const productDefinitionFilePath = path.resolve(process.cwd(), 'src/data/product-definition.json')
const periodicProcessingFilePath = path.resolve(process.cwd(), 'src/data/periodic-processing.json')
const customerRegistrationFilePath = path.resolve(process.cwd(), 'src/data/customer-registration.json')

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

const depositsApiPlugin = () => ({
  name: 'deposits-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/deposits', async (req, res, next) => {
      try {
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'GET') {
          const rows = await readDepositsFile()
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

          const rows = await readDepositsFile()
          rows.push(incomingRow)
          await writeDepositsFile(rows)

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
        res.end(JSON.stringify({ message: 'Failed to process deposits data.' }))
      }
    })
  },
})

const loanRepaymentsApiPlugin = () => ({
  name: 'loan-repayments-api-plugin',
  configureServer(server) {
    server.middlewares.use('/api/loan-repayments', async (req, res, next) => {
      try {
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
    server.middlewares.use('/api/user-setup/password-change', async (req, res, next) => {
      try {
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

// https://vite.dev/config/
export default defineConfig({
  base: '/finance-app/',
  server: {
    proxy: {
      // Proxy for lookups (branches, etc.) to avoid CORS
      '/api/lookups': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/lookups/, '/api/lookups'),
      },
      // Proxy for getmember endpoint to avoid CORS
      '/api/getmember': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/getmember/, '/api/getmember'),
      },
      // Proxy dashboard summary to avoid CORS during development
      '/api/dashboard': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/dashboard/, '/api/dashboard'),
      },
      // Proxy remote branches lookup to avoid CORS during development
      '/api/remote-branches': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-branches/, '/api/lookups'),
      },
      '/api/remote-countries': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-countries/, '/api/lookups'),
      },
      '/api/remote-member-details': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-member-details/, '/api/getmemberdetails'),
      },
      '/api/remote-member-activate': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Preserve query parameters while rewriting the path
          const [pathname, search] = path.split('?');
          const rewrittenPath = pathname.replace(/^\/api\/remote-member-activate/, '/api/Cusystem/GetMember4Activate');
          return search ? `${rewrittenPath}?${search}` : rewrittenPath;
        },
      },
      '/api/update-customer-authorisation': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/update-customer-authorisation/, '/api/Cusystem/UpdateCustomerAuthorisation'),
      },
      '/api/remote-member': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-member/, '/api/member'),
      },
      '/api/remote-client': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-client/, '/api/client'),
      },
      '/api/remote-cities': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/remote-cities/, '/api/lookups'),
      },
      // Proxy /api/client for get-code endpoint to avoid CORS
      '/api/client': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/client/, '/api/client'),
      },
      // Proxy for institution registration to avoid CORS
      '/api/corporategroupmember': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/corporategroupmember/, '/api/corporategroupmember'),
      },
      // Proxy for member create endpoint to avoid CORS
      '/api/member/create': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/member\/create/, '/api/member/create'),
      },
      // Proxy mandatory products lookup for Product Definition main category
      '/api/mandatory-products': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/mandatory-products/, '/api/lookups'),
      },
      // Proxy account details endpoint to avoid CORS
      '/api/account/details': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/account\/details/, '/api/account/details'),
      },
      // Proxy banks endpoint to avoid CORS
      '/api/banks': {
        target: 'http://alakuyateh-001-site10.atempurl.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/banks/, '/api/banks'),
      },
    },
  },
  plugins: [
    react(),
    depositsApiPlugin(),
    loanRepaymentsApiPlugin(),
    userSetupApiPlugin(),
    securitySettingsApiPlugin(),
    productDefinitionApiPlugin(),
    periodicProcessingApiPlugin(),
    customerRegistrationApiPlugin(),
  ],
})
