# SwiftSite

SwiftSite is a full-stack AI workspace built with Next.js, TypeScript, PostgreSQL and Drizzle ORM. It includes multilingual chat, deterministic slash tools, an image/video studio, prompt-built single-file websites, email/Google authentication and an owner dashboard.

## Main features

- Long, persistent conversations with automatic language mirroring
- Roman Urdu, English and common international language instructions
- Prompt-built websites saved as standalone HTML/CSS/JavaScript files
- Strict style handling: simple stays simple; 3D is only enabled when requested; named colours are respected
- Image/document/video attachments in chat; image/PDF/document analysis with a vision-capable Gemini key
- Real image and 5-/10-second AI video generation with a funded Pollinations key; no simulated AI media
- Email/password sessions for protected owner access and optional Google OAuth
- Hidden owner-only admin (`Ctrl + Shift + Z`), with audited provider and appearance settings, user blocking and rate limits
- Installable mobile PWA shell with compact bottom navigation
- Twelve deterministic server tools, including calculator, conversion, dates, hashes and JSON

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Set `DATABASE_URL` in `.env`, then create/update the database schema:

   ```bash
   npx drizzle-kit push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Optional integrations

For official Google Gemini responses, the owner must connect an actual Gemini API key in **Ctrl + Shift + Z → AI settings**, or set `GEMINI_API_KEY` on the server. Without a key, chat clearly identifies the available community model; it never pretends that Gemini is connected. Provider quotas and outages apply. Image/video generation requires a Pollinations key with credits, saved in Settings. The old owner password was exposed in conversation history and has been revoked: on this sandbox the replacement is stored only in ignored `.data/owner-credential.txt`. On a new deployment provision the owner through a secure server-side process and rotate it after first login.

For Google sign-in, create an OAuth web client and add this redirect URI:

```text
http://localhost:3000/api/auth/google
```

Use the production origin when deploying.

## Validation

Before a release, run:

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

## Data and secrets

- `.env*` files are ignored except `.env.example`.
- Runtime uploads and generated media live in `.data/` and are ignored.
- Passwords are salted and hashed with `scrypt`.
- Session cookies are HTTP-only.
- Provider credentials stay server-side and are never returned to the browser.

## Project credits

- **Mharryjs** — owner and full-stack development: HTML, CSS, JavaScript, TypeScript, Next.js, PostgreSQL, authentication, dashboard, tools, image/video studio and AI routing.
- **Hiba Kashif** — structure and design: page order, layout, mobile behaviour, visual design, wording and release testing.
