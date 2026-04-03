# TaxEase Agent Rules

When working on this project in the future, adhere strictly to these architectural rules:

1. **Israeli Tax Reality**: Always maintain historical integrity. Credit points change monetary value *every single calendar year* (e.g. 2019=218 ILS, 2024=235 ILS). Additionally, Periphery discounts ARE NOT credit points (they are capped percentage deductions). Section 46 Donations are a strict 35% tax credit. Do not mix these concepts up when editing `taxCalculator.ts`.
2. **Official Document Handling**: Gov.il uses Cloudflare. We cannot `curl` or script downloads from `taxes.gov.il` directly without facing 301/404 bot protection blocks. Official PDFs must be manually deposited into `/public` by developers, and mapped via `FORM_MAP` in `/api/generate-pdf`.
3. **Typography & PDF Generation**: The app primarily uses Hebrew RTL. Use standard Tailwind RTL support via exact explicit classNames if needed. `pdf-lib` injects basic numeric text right now.
4. **Validation**: The AI Extraction (`/api/analyze-form`) uses Gemini 2.5 Flash strictly. It applies validation to check whether the `documentYear` explicitly printed on the document matches the user's `year` parameter. Any updates to the AI prompt must preserve the `isValidTaxDoc` check.
