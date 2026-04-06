import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "לא הועלה קובץ" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "חסר מפתח API" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const arrayBuffer = await file.arrayBuffer();
    const base64Str = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        `You are an expert Israeli accountant AI.
         The user uploaded a document related to maternity leave (דמי לידה) from Bituach Leumi (ביטוח לאומי).
         
         Analyze the document carefully and extract:
         1. The total gross maternity allowance amount (סה"כ דמי לידה ברוטו) — this is the total amount BEFORE tax deduction.
         2. If this is NOT a maternity-related document, set isMaternityDoc to false.
         
         Return exactly and ONLY valid JSON without markdown wrapping or backticks:
         {
           "isMaternityDoc": boolean,
           "totalGrossAmount": number (total gross maternity allowance in ILS, 0 if not found),
           "taxDeducted": number (tax deducted from maternity allowance, 0 if not found),
           "numberOfPayments": number (how many monthly payments, 0 if not found),
           "period": string (the period covered, e.g. "01/2024 - 04/2024", empty if not found)
         }`,
        {
          inlineData: {
            data: base64Str,
            mimeType: mimeType,
          },
        },
      ],
    });

    const jsonText = response.text || "{}";
    const cleaned = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.isMaternityDoc === false) {
      return NextResponse.json({ 
        success: false, 
        error: "המסמך שהועלה אינו נראה כאישור דמי לידה מביטוח לאומי. נסו להעלות מסמך אחר או להזין את הסכום ידנית." 
      });
    }

    return NextResponse.json({
      success: true,
      amount: parsed.totalGrossAmount || 0,
      taxDeducted: parsed.taxDeducted || 0,
      numberOfPayments: parsed.numberOfPayments || 0,
      period: parsed.period || "",
    });

  } catch (error: any) {
    console.error("Maternity extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
