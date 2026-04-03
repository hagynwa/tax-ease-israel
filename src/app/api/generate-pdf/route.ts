import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
const COORDS_2024 = {
  // Identity Block (Page 1)
  idNumber: { page: 0, x: 440, y: 645 },  // Box 'מספר זהות'
  firstName: { page: 0, x: 300, y: 605 },
  lastName: { page: 0, x: 450, y: 605 },
  phone: { page: 0, x: 380, y: 485 },     // Box 'מספר טלפון נייד'
  city: { page: 0, x: 450, y: 450 },

  // Bank Info (Page 1 - Middle)
  bankId: { page: 0, x: 535, y: 418 },    // Box 'קוד בנק' (278)
  branchId: { page: 0, x: 480, y: 418 },  // Box 'סמל סניף'
  accountNum: { page: 0, x: 360, y: 418 },// Box 'מספר חשבון' (277)

  // Tax/Income Maths (Section 158/042)
  income: { page: 0, x: 170, y: 310 },    // Page 1, Section D, Box 158
  taxPaid: { page: 1, x: 170, y: 500 },   // Page 2, Section T, Box 042
  employerId: { page: 0, x: 460, y: 310 }, // Box 150
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
      
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const renderConfig = { size: 10, font, color: rgb(0, 0, 0) };

      const writeData = (val: any, coord: { page: number, x: number, y: number } | undefined) => {
         if (val && coord && pages[coord.page]) {
           pages[coord.page].drawText(String(val), { x: coord.x, y: coord.y, ...renderConfig });
         }
      };

      const computedTaxData = data.data || {}; 
      const personalData = data.personalData || {};

      // Render Identity (Numbers Only - Hebrew Text stripped for now)
      writeData(personalData.idNumber, COORDS_2024.idNumber);
      writeData(personalData.phone, COORDS_2024.phone);
      writeData(personalData.firstName, COORDS_2024.firstName);
      writeData(personalData.lastName, COORDS_2024.lastName);
      writeData(personalData.city, COORDS_2024.city);
      
      // Render Bank
      writeData(personalData.bankId, COORDS_2024.bankId);
      writeData(personalData.branchId, COORDS_2024.branchId);
      writeData(personalData.accountNum, COORDS_2024.accountNum);

      // Render Tax Maths
      writeData(computedTaxData.income, COORDS_2024.income);
      writeData(computedTaxData.taxPaid, COORDS_2024.taxPaid);
      writeData(computedTaxData.employerId, COORDS_2024.employerId);

    } else {
      // Fallback Engine if File Missing
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawText(`CRITICAL ERROR: ${fileName} not physically found in public/ directory!`, { x: 50, y: 800, size: 14, color: rgb(1, 0, 0) });
      page.drawText(`System cannot map physical coordinates without the baseline image.`, { x: 50, y: 770, size: 12 });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
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
