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
 * PDF Coordinate Mapping Grid (PostScript Points)
 * Recalibrated using official 2024 Form 135 and grid overlay.
 * Page size: 595 x 842. (y=0 is BOTTOM)
 * 
 * Coordinates target the CENTER/RIGHT of the input areas to ensure 
 * Hebrew text (rendered LTR by pdf-lib) aligns naturally with the labels.
 */

const BASE_COORDS = {
  // --- Section B: Personal Details (First Person / Right Side) ---
  idNumber:    { page: 0, x: 440, y: 665 },  // Centered in the 9-digit box area
  lastName:    { page: 0, x: 380, y: 625 },  // "שם משפחה"
  firstName:   { page: 0, x: 260, y: 625 },  // "שם פרטי"
  
  city:        { page: 0, x: 440, y: 570 },  // "יישוב"
  street:      { page: 0, x: 320, y: 570 },  // "רחוב"
  phone:       { page: 0, x: 480, y: 530 },  // "מספר טלפון נייד"

  // --- Bank Details (Section B Bottom) ---
  bankId:      { page: 0, x: 530, y: 440 },  // Box 278 (קוד בנק)
  branchId:    { page: 0, x: 480, y: 440 },  // Box (סמל סניף)
  accountNum:  { page: 0, x: 360, y: 440 },  // Box 277 (מספר חשבון)

  // --- Section D: Income Table (Page 1) ---
  income:      { page: 0, x: 135, y: 340 },  // Box 158 (Salary)
  employerId:  { page: 0, x: 435, y: 340 },  // Box 150 (Employer ID)
  
  // --- Section 55: Tax Paid (Page 2) ---
  taxPaid:     { page: 1, x: 135, y: 505 },  // Box 042 (Tax withheld)

  // --- Checkboxes (Page 1 Top) ---
  checkIncomeOnly: { page: 0, x: 434, y: 770 }, // "הכנסותי בלבד"
  checkRefund:     { page: 0, x: 364, y: 770 }, // "בקשה להחזר מס"
  
  // Marital Status (Row y=670)
  checkSingle:   { page: 0, x: 258, y: 670 },
  checkMarried:  { page: 0, x: 185, y: 670 },
  checkDivorced: { page: 0, x: 112, y: 670 },
  checkWidowed:  { page: 0, x: 42,  y: 670 },
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const year = data.year || new Date().getFullYear();
    const fileName = FORM_MAP[year as number] || FORM_MAP[2024];

    if (!fileName) {
      return NextResponse.json({ error: `No historical PDF form mapped for year ${year}` }, { status: 404 });
    }

    const formPath = join(/* turbopackIgnore: true */ process.cwd(), 'public', fileName);
    let pdfDoc;

    if (existsSync(formPath)) {
      const existingPdfBytes = readFileSync(formPath);
      pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      pdfDoc.registerFontkit(fontkit);
      
      let font;
      const fontCandidates = [
        join(/* turbopackIgnore: true */ process.cwd(), 'public', 'fonts', 'Heebo-SemiBold.ttf'),
        join(/* turbopackIgnore: true */ process.cwd(), 'public', 'fonts', 'Assistant-SemiBold.ttf'),
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

      const textConfig = { size: 10, font, color: rgb(0, 0, 0) };
      const checkConfig = { size: 12, font, color: rgb(0, 0, 0) };

      /**
       * Writing Hebrew to PDF:
       * pdf-lib renders text LTR in the character sequence provided.
       * The user confirmed that manual reversal ("יגח" instead of "חגי") 
       * results in inverted text in the viewer. 
       * 
       * Therefore, we write Hebrew text in its logical order (LTR sequence).
       */
      const drawTextAt = (val: any, coord: { page: number, x: number, y: number } | undefined, config = textConfig) => {
        if (val && coord && pages[coord.page]) {
          const text = String(val);
          // For Hebrew names, we might want to offset slightly to align right if they vary in length
          // but for now we use fixed X coordinates based on grid.
          pages[coord.page].drawText(text, { x: coord.x, y: coord.y, ...config });
        }
      };

      const drawCheckAt = (coord: { page: number, x: number, y: number } | undefined) => {
        if (coord && pages[coord.page]) {
          pages[coord.page].drawText("X", { x: coord.x, y: coord.y, ...checkConfig });
        }
      };

      const computedTaxData = data.data || {};
      const personalData = data.personalData || {};
      const activeCoords = BASE_COORDS; // Currently 2024 baseline

      // Personal Info
      // For ID, we use character spacing to align with boxes
      if (personalData.idNumber && activeCoords.idNumber) {
        pages[0].drawText(String(personalData.idNumber), {
          x: activeCoords.idNumber.x,
          y: activeCoords.idNumber.y,
          size: 10,
          font,
          // @ts-ignore - characterSpacing exists in pdf-lib 1.17+ but might missing in some type definitions
          characterSpacing: 6 
        } as any);
      }

      drawTextAt(personalData.firstName, activeCoords.firstName);
      drawTextAt(personalData.lastName, activeCoords.lastName);
      drawTextAt(personalData.phone, activeCoords.phone);
      drawTextAt(personalData.city, activeCoords.city);
      drawTextAt(personalData.street, activeCoords.street);
      
      // Bank
      drawTextAt(personalData.bankId, activeCoords.bankId);
      drawTextAt(personalData.branchId, activeCoords.branchId);
      drawTextAt(personalData.accountNum, activeCoords.accountNum);

      // Income (Page 1)
      drawTextAt(computedTaxData.income, activeCoords.income);
      drawTextAt(computedTaxData.employerId, activeCoords.employerId);

      // Tax (Page 2)
      drawTextAt(computedTaxData.taxPaid, activeCoords.taxPaid);

      // Checkboxes
      drawCheckAt(activeCoords.checkIncomeOnly);
      drawCheckAt(activeCoords.checkRefund);

      const maritalStatus = personalData.maritalStatus || "single";
      if (maritalStatus === "single") drawCheckAt(activeCoords.checkSingle);
      else if (maritalStatus === "married") drawCheckAt(activeCoords.checkMarried);
      else if (maritalStatus === "divorced") drawCheckAt(activeCoords.checkDivorced);
      else if (maritalStatus === "widowed") drawCheckAt(activeCoords.checkWidowed);

    } else {
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawText(`ERROR: Template file ${fileName} not found.`, { x: 50, y: 800, size: 12 });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Form_135_${year}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
