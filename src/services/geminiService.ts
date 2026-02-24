import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface WasteIdentification {
  type: string;
  material: string;
  description: string;
  sortingSteps: string[];
  environmentalImpact: string;
  points: number;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function toValidWasteIdentification(payload: unknown): WasteIdentification | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (
    !isNonEmptyString(candidate.type) ||
    !isNonEmptyString(candidate.material) ||
    !isNonEmptyString(candidate.description) ||
    !isNonEmptyString(candidate.environmentalImpact) ||
    !Array.isArray(candidate.sortingSteps)
  ) {
    return null;
  }

  const sortingSteps = candidate.sortingSteps.filter((step): step is string => isNonEmptyString(step));

  if (sortingSteps.length === 0) {
    return null;
  }

  const numericPoints = Number(candidate.points);
  const points = Number.isFinite(numericPoints) ? Math.max(10, Math.min(100, Math.round(numericPoints))) : 10;

  return {
    type: candidate.type,
    material: candidate.material,
    description: candidate.description,
    sortingSteps,
    environmentalImpact: candidate.environmentalImpact,
    points,
  };
}

export async function identifyWaste(base64Image: string): Promise<WasteIdentification | null> {
  try {
    const imageData = base64Image.split(',')[1];
    if (!imageData) {
      return null;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageData,
              },
            },
            {
              text: 'Identify the waste in this image. Provide the response in JSON format with the following fields: type (e.g., PLASTIK, KERTAS, LOGAM), material (specific material name), description (short description), sortingSteps (array of strings), environmentalImpact (short sentence), and points (estimated points for recycling this item, between 10-100).',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
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
          required: ['type', 'material', 'description', 'sortingSteps', 'environmentalImpact', 'points'],
        },
      },
    });

    const rawResult = JSON.parse(response.text || '{}');
    return toValidWasteIdentification(rawResult);
  } catch (error) {
    console.error('Error identifying waste:', error);
    return null;
  }
}
