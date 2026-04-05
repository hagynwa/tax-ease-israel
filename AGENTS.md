# TaxEase Agent Rules

When working on this project in the future, adhere strictly to these architectural rules:

1. **Strict Local Testing**: The user is extremely cautious about broken deployments. NEVER push to GitHub without a formal "Looks good on local?" check.
2. **PDF Mapping**: Form 135 (2024) uses a specific grid documented in `generate-pdf/route.ts`.
3. **Israeli Tax Expertise**: All logic in `taxCalculator.ts` follows historical Israeli law (2019-2025). Keep it pure, stateless, and mathematically accurate.
4. **Binary Processing**: Always use `req.arrayBuffer()` for large binary uploads (PDF/Images) to avoid FormData parsing errors in the App Router.
5. **Israeli Tax Reality**: Always maintain historical integrity. Credit points change monetary value *every single calendar year* (e.g. 2019=218 ILS, 2024=235 ILS). Additionally, Periphery discounts ARE NOT credit points (they are capped percentage deductions). Section 46 Donations are a strict 35% tax credit. Do not mix these concepts up when editing `taxCalculator.ts`.
6. **Official Document Handling**: Gov.il uses Cloudflare. We cannot `curl` or script downloads from `taxes.gov.il` directly without facing 301/404 bot protection blocks. Official PDFs must be manually deposited into `/public` by developers, and mapped via `FORM_MAP` in `/api/generate-pdf`.
7. **Typography & PDF Generation**: The app primarily uses Hebrew RTL. Use standard Tailwind RTL support via exact explicit classNames if needed. `pdf-lib` injects basic numeric text right now.
8. **Validation**: The AI Extraction (`/api/analyze-form`) uses Gemini 2.5 Flash strictly. It applies validation to check whether the `documentYear` explicitly printed on the document matches the user's `year` parameter. Any updates to the AI prompt must preserve the `isValidTaxDoc` check.
