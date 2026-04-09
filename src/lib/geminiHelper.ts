import { GoogleGenAI } from "@google/genai";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500; // Base delay

export async function generateContentWithRetry(ai: GoogleGenAI, requestOptions: any) {
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      return await ai.models.generateContent(requestOptions);
    } catch (error: any) {
      attempt++;
      
      const isOverloaded = error?.status === "UNAVAILABLE" || error?.status === 503 || 
                           (error?.message && error.message.includes("high demand"));
                           
      if (isOverloaded && attempt < MAX_RETRIES) {
        console.warn(`[Gemini API] Capacity error (503). Retrying attempt ${attempt} in ${RETRY_DELAY_MS * attempt}ms...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(1.5, attempt - 1)));
        
        // As a fallback on retries, sometimes it helps to switch models temporarily if flash is very overloaded
        if (attempt === 2 && requestOptions.model === "gemini-2.5-flash") {
           console.log("[Gemini API] Falling back to gemini-2.5-pro for this request due to flash 503.");
           requestOptions.model = "gemini-2.5-pro";
        }
      } else {
        // If it's not a 503 or we've exhausted retries, throw the error
        throw error;
      }
    }
  }
  throw new Error("Unreachable code in generateContentWithRetry");
}
