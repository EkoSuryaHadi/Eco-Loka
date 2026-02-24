import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WasteIdentification {
  type: string;
  material: string;
  description: string;
  sortingSteps: string[];
  environmentalImpact: string;
  points: number;
}

export async function identifyWaste(base64Image: string): Promise<WasteIdentification | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1],
              },
            },
            {
              text: "Identify the waste in this image. Provide the response in JSON format with the following fields: type (e.g., PLASTIK, KERTAS, LOGAM), material (specific material name), description (short description), sortingSteps (array of strings), environmentalImpact (short sentence), and points (estimated points for recycling this item, between 10-100).",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            material: { type: Type.STRING },
            description: { type: Type.STRING },
            sortingSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            environmentalImpact: { type: Type.STRING },
            points: { type: Type.NUMBER },
          },
          required: ["type", "material", "description", "sortingSteps", "environmentalImpact", "points"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as WasteIdentification;
  } catch (error) {
    console.error("Error identifying waste:", error);
    return null;
  }
}
