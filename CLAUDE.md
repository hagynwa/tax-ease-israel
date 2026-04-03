# TaxEase System Rules & Context (CLAUDE.md)

## App Overview
TaxEase handles tax coordination and refunds for Israeli citizens using Next.js, Framer Motion, and Google Gemini OCR. It uses highly specific historic mappings for tax brackets, credit points, and official government Form 135 templates.

## Developer Instructions
- **Run Locally**: `npm run dev`
- **Frontend Strategy**: Dark mode, premium UI, RTL orientation using Heebo/Tailwind. Stateful flows managed via React `useState` across multi-step wizards.
- **Backend Strategy**: Serverless Next API routes. Specifically:
  - `/api/analyze-form`: Extracts JSON from Hebrew PDFs/Images via `gemini-2.5-flash`. Runs logic validation (Year vs uploaded document printed year).
  - `/api/generate-pdf`: Compiles binary PDFs using `pdf-lib`. It reads the baseline templates out of `public/` depending on the `year` selected. Always utilize `FORM_MAP` definitions when working with this route.
- **Form 135 Layouts**: Wait until official Gov.il forms are updated before re-mapping `public/` pointers. In the meantime, the 2025 system falls back visually to the `135-2024.pdf` structure.
- **Tax Math**: `src/lib/taxCalculator.ts`. Do not decouple brackets from years. Brackets scale differently over time due to Israeli inflation indexing. Always cross-check credit point ILS values annually.
