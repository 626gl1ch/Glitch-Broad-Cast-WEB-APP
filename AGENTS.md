# Glitch Broadcast — Backend Ops Rules
> Project: **Glitch Broadcast** (`glitch-broadcast-backend`)
> Stack: Node.js / Express, Supabase (PostgreSQL + Storage), Google Gemini AI,
> Meta Graph API, LinkedIn API, Puppeteer (assisted Facebook Group posting).
> **Cloudflare is NOT used in this project.** Do not assume or
> suggest MCP connections for it here. Paystack IS used for subscriptions.

---

## A.0 — How Antigravity should use this document

1. Before any backend task, re-read this file and `~/.gemini/GEMINI.md`.
2. If a capability is listed under "Not possible via MCP — custom tool needed,"
   use the provided custom MCP server template instead of forcing an existing tool.
3. Always obey the Security Rules in `~/.gemini/GEMINI.md` regardless of what's
   asked — if a request conflicts with a security rule, stop and ask.
4. **Default to read-only / plan-first.** Never execute a destructive or
   data-modifying action without showing the exact command/payload and getting a
   go-ahead first, unless pre-authorized for this session.

---

## A.1 — Supabase MCP (only backend service for this project)

### Connection names (global MCP config, project-prefixed)

| Server name | URL / scope | When to use |
|---|---|---|
| `supabase-glitch-broadcast` | `read_only=true` | Default — auditing, querying, schema inspection |
| `supabase-glitch-broadcast-write` | `read_only=false` | Only when actively supervising a migration |

> **Project ref:** `mdmpcxtjwnovbhidwwhj` — already set in `~/.gemini/config/mcp_config.json`.
> Note: this is the same Supabase project used by SnipeJob (shared instance).
> First connection triggers OAuth in-browser.

### What the Supabase MCP can do

- Run arbitrary SQL (`execute_sql`)
- Apply and generate migrations
- List tables, columns, relationships, extensions
- Generate TypeScript types from schema
- Pull security and performance advisories (`get_advisors` — RLS gaps, missing indexes)
- Pull live logs
- Manage schema branches (create / list / merge / rebase / delete / reset)
- List, deploy, and inspect Edge Functions
- Search Supabase docs
- Project and org admin
- Update storage config (paid plans)

### Not possible via MCP — build custom if needed

| Gap | Custom approach |
|---|---|
| Bulk Auth user management with custom claims | Thin custom MCP tool using `supabase-js` `auth.admin` methods |
| Row-level data seeding for branches (branches copy schema only, not data) | Custom `seed_branch` tool running a seed SQL script |

### This project's schema reference

- **Tables defined in:** `backend/db/schema.sql`
- **Storage bucket:** `content-vault` (public, for uploaded media)
- **Client library:** `@supabase/supabase-js` ^2.45.4
- **Credentials in:** `backend/.env` → `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## A.2 — Cloudflare MCP

**Not applicable.** This project does not use Cloudflare Workers, DNS, R2, D1,
KV, or any other Cloudflare service. Do not propose or configure a Cloudflare
MCP server for this workspace.

---

## A.3 — Paystack Integration

Paystack is used for subscriptions. A backend endpoint handles webhooks and initialization.

---

## A.4 — Other services (no MCP available — use direct API / SDK)

These services are used in this project but have no MCP server. Interact with
them through the codebase (`backend/services/`, `backend/routes/`), not via MCP.

| Service | Purpose | Creds in `.env` |
|---|---|---|
| Google Gemini AI | Content generation, alt text, AI chat | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Meta Graph API | Facebook Page + Instagram Business posting | `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_BUSINESS_ACCOUNT_ID` |
| LinkedIn API | Profile / company page posting | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN` |
| Puppeteer | Assisted Facebook Group posting (never auto-clicks Post) | `PUPPETEER_USER_DATA_DIR`, `PUPPETEER_HEADLESS` |

---

## A.5 — Ongoing behavior (every backend task)

### Pre-flight (before starting any backend task)

1. Re-read this file and `~/.gemini/GEMINI.md`.
2. State which MCP connection you'll use and confirm scope:
   - Which named server (`supabase-glitch-broadcast` vs. `-write`)?
   - Read-only or write? Is this a schema inspection or a migration?
3. Confirm you're pointed at the correct project (not another project sharing
   the global MCP config).
4. If the task involves any of the non-MCP services above, name which
   `backend/services/` file handles it before touching anything.

### Post-flight (after completing any backend task)

1. Re-query affected resources to confirm the change applied.
2. Check for orphaned resources (e.g. columns with no references, storage
   objects left after a migration).
3. Summarize what changed in plain text: resource name, before → after.

Never skip pre/post-flight to save time. Never treat a prior successful run
as blanket authorization for a similar-but-distinct action later.

### Destructive action gate

For any of the following, print the exact SQL / payload and wait for explicit
confirmation — no exceptions:

- Any `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or unscoped `DELETE FROM`
- Any migration that alters a column type or removes a constraint
- Deleting storage bucket contents
- Revoking or rotating a service role key

---

## A.6 — Supabase schema branch workflow (when used)

1. Create a branch from `main` for the feature being developed.
2. Apply migrations on the branch — never directly on the production project
   unless explicitly confirmed.
3. Review the migration diff before merging to `main`.
4. After merge, run `get_advisors` to catch any RLS gaps or missing indexes
   introduced by the change.
5. Seed data (if needed) separately — branches copy schema only, not row data.
