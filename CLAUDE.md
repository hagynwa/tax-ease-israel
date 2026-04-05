# TaxEase System Rules & Context (CLAUDE.md)

## App Overview
TaxEase handles tax coordination and refunds for Israeli citizens using Next.js, Framer Motion, and Google Gemini OCR. It uses highly specific historic mappings for tax brackets, credit points, and official government Form 135 templates.

## Development Workflow
- **Local First**: Always verify changes on `localhost:3000` before suggesting a deployment.
- **No Auto-Push**: NEVER run `git push` or `railway deploy` without explicit user permission.
- **Commit Pattern**: Minimal, descriptive commits after each logical fix.
- **PDF Calibration**: Requires physical A4 pixel coordinates (595x841). Helvetica font is used for numbers for compatibility.

## Tech Stack
- Frontend: Next.js 16 (App Router), Tailwind 4, Framer Motion.
- Backend: Next.js API Routes, @google/genai (v1beta for OCR), pdf-lib (binary streams).
- Database: Supabase (Auth/Session middleware).

## Rules & Constraints
1. **Strict Local Testing**: The user is extremely cautious about broken deployments. NEVER push to GitHub without a formal "Looks good on local?" check.
2. **PDF Mapping**: Form 135 (2024) uses a specific grid documented in `generate-pdf/route.ts`.
3. **Israeli Tax Expertise**: All logic in `taxCalculator.ts` follows historical Israeli law (2019-2025). Keep it pure, stateless, and mathematically accurate.
4. **Binary Processing**: Always use `req.arrayBuffer()` for large binary uploads (PDF/Images) to avoid FormData parsing errors in the App Router.
5. **Form 135 Layouts**: Wait until official Gov.il forms are updated before re-mapping `public/` pointers. In the meantime, the 2025 system falls back visually to the `135-2024.pdf` structure.
6. **Tax Math**: `src/lib/taxCalculator.ts`. Do not decouple brackets from years. Brackets scale differently over time due to Israeli inflation indexing. Always cross-check credit point ILS values annually.
