# Vite Proxy Endpoint Agent

## Purpose
This agent ensures that any new backend API endpoints used in the codebase are properly configured in the Vite proxy section of vite.config.js, and that CORS is handled for all proxied endpoints. This prevents CORS and 404 issues during local development.

## Workflow
1. **Scan the codebase** for all fetch/XHR/axios calls to /api/* endpoints.
2. **Parse vite.config.js** for all proxy entries under server.proxy.
3. **Compare** the endpoints used in the codebase with those configured in the proxy.
4. **Report** any missing proxy entries and suggest the correct configuration block for vite.config.js.
5. **Check** that each proxy entry has `changeOrigin: true` and `secure: false` to handle CORS.
6. **Warn** if a proxy entry is present but missing CORS-related options or has an incorrect target/rewrite.
7. **Optionally**: Offer to auto-insert the missing proxy entry if user approves.

## Usage
- Run this agent after adding new API endpoints or when encountering CORS/404 issues in development.
- The agent will output a list of missing proxy entries, CORS misconfigurations, and the exact code to add to vite.config.js.

## Example Output
```
Missing Vite proxy for endpoint: /api/member/create
Suggested vite.config.js entry:
'/api/member/create': {
  target: 'http://alakuyateh-001-site10.atempurl.com',
  changeOrigin: true, // Handles CORS
  secure: false,      // Handles CORS for self-signed certs
  rewrite: (path) => path.replace(/^/api/member/create/, '/api/member/create'),
},

CORS warning: /api/other/endpoint is missing changeOrigin: true
```

## Implementation Notes
- Use static and dynamic code search for /api/ and backend URLs.
- Parse vite.config.js as JS, not just text.
- Support both string and RegExp rewrites.
- Support multi-level endpoints (e.g., /api/member/create, /api/member/update).
- Warn if a proxy entry is present but the rewrite/target is incorrect.
- Always check for CORS-related proxy options.

---

**Agent Name:** vite-proxy-cors-checker
**Scope:** Vite + React projects
**Author:** GitHub Copilot
