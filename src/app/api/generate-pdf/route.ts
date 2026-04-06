import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { join } from "path";
import { readFileSync, existsSync } from "fs";

// Mapping of the historical forms provided by the user
const FORM_MAP: Record<number, string> = {
  2026: "Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
  2025: "Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
  2024: "Service_Pages_Income_tax_annual-report-2024_135-2024.pdf",
  2023: "Service_Pages_Income_tax_annual-report-2023_135-2023.pdf",
  2022: "Service_Pages_Income_tax_annual-report-2022_annual-singular-report-2022_135-2022.pdf",
  2021: "Service_Pages_Income_tax_annual-report-2021_135 - 2021.pdf",
  2020: "Service_Pages_Income_tax_annual-report-2020_135 - 2020.pdf",
  2019: "Service_Pages_Income_tax_itc135-19.pdf"
};

/**
 * PDF Coordinate Mapping Grid (Postscript Pixels)
 * Form 135 Gov.il - 2024 baseline.
 * 
 * Target X/Y pixels have been mathematically calibrated based on physical A4 scale (595x841).
 */
const BASE_COORDS = {
  // Identity Block (Page 1)
  idNumber: { page: 0, x: 440, y: 645 },  // Box 'מספר זהות'
  firstName: { page: 0, x: 300, y: 630 },
  lastName: { page: 0, x: 450, y: 630 },
  phone: { page: 0, x: 380, y: 520 },     // Box 'מספר טלפון נייד'
  city: { page: 0, x: 450, y: 485 },

  // Bank Info (Page 1 - Middle)
  bankId: { page: 0, x: 535, y: 423 },    // Box 'קוד בנק' (278)
  branchId: { page: 0, x: 480, y: 423 },  // Box 'סמל סניף'
  accountNum: { page: 0, x: 360, y: 423 },// Box 'מספר חשבון' (277)

  // Tax/Income Maths (Section 158/042)
  income: { page: 0, x: 170, y: 315 },    // Page 1, Section D, Box 158
  taxPaid: { page: 1, x: 170, y: 505 },   // Page 2, Section T, Box 042
  employerId: { page: 0, x: 460, y: 315 }, // Box 150
};

// Architecture allowing specific Y/X offsets per tax year (as forms slightly change every year)
// Currently all mapped to the 2024 baseline. Can be fine-tuned manually later.
const COORDS_BY_YEAR: Record<number, typeof BASE_COORDS> = {
  2026: { ...BASE_COORDS },
  2025: { ...BASE_COORDS },
  2024: { ...BASE_COORDS },
  2023: { ...BASE_COORDS },
  2022: { ...BASE_COORDS },
  2021: { ...BASE_COORDS },
  2020: { ...BASE_COORDS },
  2019: { ...BASE_COORDS },
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const year = data.year || new Date().getFullYear();
    const fileName = FORM_MAP[year as number] || FORM_MAP[2024];

    if (!fileName) {
      return NextResponse.json({ error: `No historical PDF form mapped for year ${year}` }, { status: 404 });
    }

    const formPath = join(process.cwd(), 'public', fileName);
    let pdfDoc;

    if (existsSync(formPath)) {
      const existingPdfBytes = readFileSync(formPath);
      pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      pdfDoc.registerFontkit(fontkit);
      
      let font;
      // Try Heebo (static, guaranteed pdf-lib compatible), then fall back to Assistant
      const fontCandidates = [
        join(process.cwd(), 'public', 'fonts', 'Heebo-SemiBold.ttf'),
        join(process.cwd(), 'public', 'fonts', 'Assistant-SemiBold.ttf'),
      ];
      let fontLoaded = false;
      for (const fontPath of fontCandidates) {
        if (existsSync(fontPath)) {
          try {
            const fontBytes = readFileSync(fontPath);
            font = await pdfDoc.embedFont(fontBytes);
            fontLoaded = true;
            break;
          } catch (e: any) {
            console.warn(`Font at ${fontPath} failed to embed: ${e.message}, trying next...`);
          }
        }
      }
      if (!fontLoaded || !font) {
        throw new Error("No compatible Hebrew font found in public/fonts/");
      }

      const renderConfig = { size: 10, font, color: rgb(0, 0, 0) };

      const reverseHebrew = (str: string) => {
        return String(str).split(' ').reverse().map(word => {
          if (/^[0-9A-Za-z.\-\/]+$/.test(word)) return word;
          return word.split('').reverse().join('');
        }).join(' ');
      };

      const writeData = (val: any, coord: { page: number, x: number, y: number } | undefined) => {
         if (val && coord && pages[coord.page]) {
           const reversed = reverseHebrew(val); 
           pages[coord.page].drawText(reversed, { x: coord.x, y: coord.y, ...renderConfig });
         }
      };

      const computedTaxData = data.data || {}; 
      const personalData = data.personalData || {};

      // Get year-specific coordinates or fallback to baseline
      const activeCoords = COORDS_BY_YEAR[year as number] || BASE_COORDS;

      // Render Identity (Numbers Only - Hebrew Text stripped for now)
      writeData(personalData.idNumber, activeCoords.idNumber);
      writeData(personalData.phone, activeCoords.phone);
      writeData(personalData.firstName, activeCoords.firstName);
      writeData(personalData.lastName, activeCoords.lastName);
      writeData(personalData.city, activeCoords.city);
      
      // Render Bank
      writeData(personalData.bankId, activeCoords.bankId);
      writeData(personalData.branchId, activeCoords.branchId);
      writeData(personalData.accountNum, activeCoords.accountNum);

      // Render Tax Maths
      writeData(computedTaxData.income, activeCoords.income);
      writeData(computedTaxData.taxPaid, activeCoords.taxPaid);
      writeData(computedTaxData.employerId, activeCoords.employerId);

    } else {
      // Fallback Engine if File Missing
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawText(`CRITICAL ERROR: ${fileName} not physically found in public/ directory!`, { x: 50, y: 800, size: 14, color: rgb(1, 0, 0) });
      page.drawText(`System cannot map physical coordinates without the baseline image.`, { x: 50, y: 770, size: 12 });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Official_Form_135_${year}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Enginer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
