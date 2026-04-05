import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { calculateTaxRefund } from "@/lib/taxCalculator";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const yearStr = formData.get("year") as string;
    const pointsStr = formData.get("points") as string;
    
    // Expert Tax Variables
    const donations = parseFloat(formData.get("donations") as string) || 0;
    const lifeInsurance = parseFloat(formData.get("lifeInsurance") as string) || 0;
    const peripheryPercent = parseFloat(formData.get("peripheryPercent") as string) || 0;
    const peripheryCeiling = parseFloat(formData.get("peripheryCeiling") as string) || 0;
    const maternityAllowanceInput = parseFloat(formData.get("maternityAllowance") as string) || 0;
    const deferredPoint = formData.get("deferredPoint") === "true";

    const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
    const userPoints = pointsStr ? parseFloat(pointsStr) : 2.25;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let extractedData = {
      employerId: "931234567",
      employerName: "Mock Company Ltd",
      income: 140000,
      taxPaid: 21000,
      monthsWorked: 10,
    };

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const arrayBuffer = await file.arrayBuffer();
      const base64Str = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          `You are an expert Israeli accountant AI.
           The user selected the tax year: ${year}.
           Analyze the uploaded document. If it is NOT a Form 106, Payslip, or Form 161, set isValidTaxDoc to false.
           Extract the primary tax year written on the document (usually "שנת מס").            Extract the following exact fields into a raw JSON object:
            {
              "isValidTaxDoc": boolean (true if it's a 106, 161, or Bituach Leumi Maternity Confirmation),
              "documentYear": number (the tax year stated on the form),
              "employerId": "string (תיק ניכויים)",
              "employerName": "string",
              "income": number (total from section 158 or 172 sum),
              "taxPaid": number (amount in section 042),
              "monthsWorked": number (how many months this employee worked according to the form),
              "maternityAllowanceDetected": number (if this is a Bituach Leumi form, extract the total "דמי לידה" amount)
            }
            Return exactly and ONLY valid JSON without markdown wrapping or backticks.`,
          {
            inlineData: {
              data: base64Str,
              mimeType: mimeType,
            },
          },
        ],
      });

      try {
        const jsonText = response.text || "{}";
        const cleaned = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.isValidTaxDoc === false) {
           return NextResponse.json({ error: "המסמך שהועלה אינו במבנה של טופס 106 הקביל של רשות המסים." }, { status: 400 });
        }

        if (parsed.documentYear && parsed.documentYear !== year && Math.abs(parsed.documentYear - year) > 1) {
           return NextResponse.json({ error: `חוסר התאמה: בחרת שנת מס ${year}, אך הטופס שהועלה שייך לשנת ${parsed.documentYear}.` }, { status: 400 });
        }
        
        if (parsed.income && parsed.taxPaid != null) {
          extractedData = { ...extractedData, ...parsed };
        }
      } catch (e) {
        console.error("Failed to parse Gemini JSON response", e);
      }
    } else {
      console.warn("GEMINI_API_KEY is missing. Using mock data for calculation.");
    }

    const options = {
      donations,
      lifeInsurance,
      peripheryPercent,
      peripheryCeiling,
      maternityAllowance: Math.max(maternityAllowanceInput, (extractedData as any).maternityAllowanceDetected || 0),
      deferredPoint
    };

    const analysis = calculateTaxRefund(
      extractedData.income, 
      extractedData.taxPaid, 
      extractedData.monthsWorked,
      userPoints,
      year,
      options
    );

    return NextResponse.json({
      success: true,
      data: extractedData,
      analysis: analysis,
      isMockContext: !apiKey
    });

  } catch (error: any) {
    console.error("File processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
