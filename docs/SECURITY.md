# Security

## Principles

1. **Everything sent to the browser is public.** HTML, CSS, JavaScript, `frontend/config/site.js`,
   `/content`, `/shared` and source maps can be read by anyone. They contain no secrets.
2. **Secrets live only in backend environment variables** (`backend/.env` locally, the
   hosting dashboard in production). `.env` is in `.gitignore`. `.env.example` has no values.
3. **The server checks everything again.** Browser validation is only for convenience.
4. **Visitors see generic errors.** Details (module, operation, reason) are only written to the server log.
5. **No third parties by default.** No trackers, no Google Fonts, no external scripts or CDNs.

## What is implemented

| Area | Implementation | File |
|---|---|---|
| Input validation | shared schema (required, length, e-mail, allowed topics, consent) | `shared/contact-schema.js` |
| Output encoding | all content escaped at build time (`html` tagged template), e-mail HTML escaped | `frontend/build/lib/html.js`, `backend/src/services/email.js` |
| Unsafe links | content URLs limited to `http(s):`, `mailto:`, `tel:`, `/`, `#` | `safeUrl()` in `html.js` |
| Content Security Policy | `default-src 'self'`, no inline scripts/styles, `object-src 'none'`, `frame-ancestors 'self'` | `backend/src/lib/security-headers.js`, `frontend/build/lib/seo.js` (`_headers`) |
| Other headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP`, HSTS (production) | same |
| CSRF | API accepts JSON only, `Origin` must be in `ALLOWED_ORIGINS`, signed single-use form token, no cookies/sessions | `backend/src/lib/http.js`, `form-token.js` |
| Spam protection | honeypot field, minimum fill time, token expiry, single use | `routes/contact.js`, `form-token.js` |
| Rate limiting | per IP, `RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MINUTES` (HTTP 429) | `lib/rate-limit.js` |
| Request limits | 16 KB body limit, header/request timeouts | `lib/http.js`, `server.js` |
| Path traversal | static file server blocks `../` and null bytes | `lib/static-files.js` |
| Safe errors | `HttpError` with public message, 500 without details | `server.js` |
| Fail fast | production start refused without `FORM_TOKEN_SECRET` / real delivery | `config.js` |
| Dependency hygiene | backend: **no runtime dependencies**; frontend build: only `sharp` + `qrcode` (build time only, never shipped) | `package.json` files |
| Demo funnels | no network requests, no storage, clearly labelled | `frontend/demos/shared/demo-funnel.js` |
| Secret scan | `npm run check` scans `/dist` for API keys, private keys, env assignments | `scripts/check-site.js` |
| Tests | origin, token, honeypot, rate limit, validation, headers, error leakage | `backend/test/contact.test.js` |

## Before going live – checklist

- [ ] `NODE_ENV=production`
- [ ] `FORM_TOKEN_SECRET` set (32+ random characters)
- [ ] `ALLOWED_ORIGINS` = your real domain(s) with `https://`
- [ ] `TRUST_PROXY=true` if the host uses a proxy/load balancer (otherwise all visitors share one rate limit)
- [ ] `CONTACT_DELIVERY=resend` or `webhook` with valid keys
- [ ] HTTPS active on the domain
- [ ] `npm test` and `npm run build && npm run check` pass
- [ ] Datenschutz page names the hosting and e-mail provider

## Later extensions

- **Several server instances:** move rate limit and used tokens to a shared store (e.g. Redis).
- **CAPTCHA** (only if spam gets through): e.g. a privacy-friendly challenge, verified **server-side** in `routes/contact.js`.
- **Authentication / admin area:** implement on the server (sessions with `HttpOnly`, `Secure`, `SameSite` cookies and CSRF tokens). Never protect content by hiding it in frontend JavaScript.
- **AI / CRM integrations:** call them from backend services. API keys stay in environment variables.
- **Analytics:** only with consent and a matching privacy policy. Add the host to the CSP explicitly.

## Reporting errors

Server logs follow this format:

```
2026-01-01T10:00:00.000Z ERROR [CONTACT FORM] Failed to submit contact request.
  Module: backend/routes/contact
  Reason: Email provider responded with status 401
```

The visitor only sees: *"Your message could not be sent. Please try again."*
