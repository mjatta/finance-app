# Microfinance App (React + Vite)

Frontend for a Sacco/Microfinance Management System built with React, Vite, Material‑UI, and TanStack React Query. The project is organized by functional features such as member administration, loan management, accounting, system configuration, and reporting.

## Folder structure overview

```
src/
  features/
    member/
      MemberOperations/
      DepositManagement/
      VerificationControls/
      Adjustments/
    loan/
      Repayments/
      RecoveryWriteOff/
      Reporting/
    accounting/
      LedgerManagement/
      Reconciliation/
      PeriodicProcessing/
    system/
      UserSecurity/
      UserRoles/
      SystemMaintenance/
      ModuleSetup/
        ProductDefinition/
        DepartmentalSetup/
    reporting/
  App.jsx
  main.jsx
  ...
```

Each feature folder contains React components and hooks relevant to that part of the workflow. Routing is managed with `react-router-dom` and data fetching is handled by `@tanstack/react-query` with `axios` as the HTTP client.

## Getting started

Install dependencies with:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173` by default.  
A simple login page is shown for unauthenticated users; once signed in, the app auto‑redirects to the landing dashboard and the top navigation bar provides links to every feature of the system.

## Save toasts and audit logs

- All Save actions now show a toast for 45 seconds.
- Successful saves show a success toast.
- Failed saves show an error toast.
- Every save event is logged in browser local storage under key `microfinance.save.logs`.

To inspect logs in the browser console:

```js
JSON.parse(localStorage.getItem('microfinance.save.logs') || '[]')
```

To clear logs:

```js
localStorage.removeItem('microfinance.save.logs')
```

## Next steps

- Flesh out individual components and pages in each feature folder
- Add API endpoints and React Query hooks for data operations
- Implement authentication, access control, and MUI theming
- Develop reporting dashboards and charts


---
