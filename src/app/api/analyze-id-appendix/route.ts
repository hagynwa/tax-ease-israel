import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from "@/lib/geminiHelper";

export async function POST(req: NextRequest) {
  try {
    const mimeType = req.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await req.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "No file payload received" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: true, birthYears: [2015, 2018], isMock: true });
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Str = Buffer.from(arrayBuffer).toString("base64");

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: [
        `You are an expert Israeli OCR bot. The user uploaded an Israeli ID Appendix (ספח תעודת זהות) or ID Card.
         Look at the document carefully. Extract only these fields:
         1. firstName (שם פרטי של בעל התעודה).
         2. lastName (שם משפחה של בעל התעודה).
         3. idNumber (מספר זהות - 9 digits).
         4. Gender (male or female). Look for "מין".
         5. Marital Status (e.g. נשוי, רווק, גרוש, אלמן) - Look for "מצב משפחתי".
         6. City - Extract only the city name from "יישוב" or "כתובת".
         7. birthYears - Critical: Read the "ילדים" (Children) table line by line from top to bottom. Extract the exact 4-digit Gregorian birth year for EVERY SINGLE child listed. Do not skip any rows, even if slightly obscured. Return an array of all their birth years e.g. [2015, 2018, 2020, 2023]. Return [] if no children exist.`,
        {
          inlineData: {
            data: base64Str,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            idNumber: { type: "string" },
            gender: { type: "string" },
            maritalStatus: { type: "string" },
            city: { type: "string" },
            birthYears: { type: "array", items: { type: "number" } }
          }
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");

      return NextResponse.json({ success: true, ...parsed });
    } catch (e) {
      console.error("Failed to parse ID Appendix Gemini response", e);
      return NextResponse.json({ error: "שגיאה בפענוח נתוני הילדים מהספח." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("ID processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
