# TaxEase Architecture & Context Memory

## Project Overview
TaxEase is an advanced Next.js web application built to automate Israeli tax refunds (החזר מס) and tax coordination (תיאום מס). It translates complex historical tax brackets and demographics into an intuitive, gamified UI utilizing conversational flows and dynamic document generation.

## Development Progress
- [x] Step 5: Advanced Personal & Bank Data Wizards.
- [x] Step 6: Form 135 PDF Generation with coordinate-based injection.
- [x] ID Appendix OCR: Exhaustive birth year scanning and auto-demographics.
- [x] Periphery Residency: Auto-calculating discounts based on city mapping.
- [x] Railway Deployment: Configured with Supabase safety checks.

## Critical Constraints (USER ENFORCED)
1. **NO AUTO-PUSH**: Do not push to GitHub or deploy without asking. User prefers checking everything on `localhost:3000` first.
2. **Local Testing**: Always confirm "Look at it on localhost" before finalizing a turn.
3. **PDF Hebrew**: Helvetica font used for numbers only. Hebrew text must be cleaned (`replace(/[^\x00-\x7F]/g, ".")`) to prevent crashes until Hebrew TTF is embedded.

## Expert Knowledge: Israeli Income Tax Rules
Through deep research, the following rigid constructs govern our Tax Engine:
1. **Siyua LaHorim (Children Points)**: Child points are heavily tethered to historical years. We must compute `Selected Year - Birth Year`. Prior to 2022, ages 6-17 didn't get points for men. In 2024, points were wildly expanded (e.g. 4.5 points for 1-2 year olds).
2. **Section 46 Donations (סעיף 46)**: Donations to recognized institutions yield a **35% direct tax credit**. If someone donates 1,000 ILS, their final tax owed strictly drops by 350 ILS.
3. **Periphery Residency (הנחת תושב יישוב מוטב)**: This is NOT a credit point. It is a **Percentage Discount** off the gross taxable income (e.g., 10%, 12%, 20%) capped at an annual ceiling (e.g., up to 250,000 ILS). This is a vital difference in tax calculus.
4. **Life Insurance & Provident Funds**: Provides a **25% tax credit** on premiums paid out-of-pocket (not via employer offset).

## Core Features & Technologies
- **Framework**: Next.js (App Router), Tailwind CSS, Framer Motion.
- **AI Extraction Engine**: Google Gemini 2.5 Flash API (`@google/genai`) does visual OCR on Hebrew documents (Form 106, Payslips). It extracts key metrics internally and mathematically cross-references the User's input year with the document's printed year to prevent mismatches.
- **Dynamic Tax Calculator (`src/lib/taxCalculator.ts`)**: Contains exact historical mapping for Israeli credit point values (e.g. ₪218 in 2019 vs ₪242 in 2025) and exact historical marginal tax brackets (10%, 14%, 20%). 
- **Demographics Engine**: Asks users explicitly about: Gender, exact children ages (via ID OCR), Disability (Form 116a), Alimony, Periphery Residency (Form 1312a), and New Immigrants.
- **Multi-Year PDF Form Generator (`src/app/api/generate-pdf/route.ts`)**: Uses explicit historical PDF layouts mapped to the frontend year.

## Future Development Notes
1. **Adding New Years**: When the official Form 135 for 2025/2026 is published, update the `public/` folder and `FORM_MAP`.
2. **Database Integration**: Proceed with Supabase user auth and Row-Level-Security storage for parsed files.
