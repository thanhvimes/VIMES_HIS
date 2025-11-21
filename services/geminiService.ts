import { GoogleGenAI, Type } from "@google/genai";
import { Patient, AISuggestion } from '../types';

const getAISuggestions = async (
  symptoms: string,
  notes: string,
  patient: Patient | { age: number; gender: string }
): Promise<AISuggestion> => {
  // The API key is securely managed as an environment variable (process.env.API_KEY)
  // and is directly used by the GoogleGenAI constructor.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert medical assistant AI. Your role is to analyze clinical notes and provide structured suggestions to a qualified physician. 
    
    IMPORTANT: This is for a simulation/educational context. DO NOT provide a definitive diagnosis. Always suggest referencing clinical guidelines.

    Analyze the following information for a ${patient.age}-year-old ${patient.gender} patient.

    Patient Symptoms / History (Quá trình bệnh lý):
    ---
    ${symptoms || 'Not provided.'}
    ---

    Physician's Clinical Exam Notes (Khám lâm sàng):
    ---
    ${notes || 'Not provided.'}
    ---

    Based on the information, provide:
    1. A concise summary of the case.
    2. A list of potential diagnoses (ICD-10 style if possible) for the physician to consider.
    3. A list of suggested next steps (specific lab tests, imaging, or immediate treatments).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A brief summary of the patient's condition based on notes.",
            },
            potentialDiagnoses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of possible diagnoses for the physician to consider.",
            },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of recommended next steps, such as tests or referrals.",
            },
          },
          required: ["summary", "potentialDiagnoses", "nextSteps"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const parsedResponse: AISuggestion = JSON.parse(jsonText);
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get AI suggestions.");
  }
};

export { getAISuggestions };
