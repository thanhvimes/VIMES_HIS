import { GoogleGenAI, Type } from "@google/genai";
import { Patient, AISuggestion } from '../types';

const getAISuggestions = async (
  symptoms: string,
  notes: string,
  patient: Patient
): Promise<AISuggestion> => {
  // The API key is securely managed as an environment variable (process.env.API_KEY)
  // and is directly used by the GoogleGenAI constructor.
  // This ensures the key is not exposed in the frontend code.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert medical assistant AI. Your role is to analyze clinical notes and provide structured suggestions to a qualified physician. DO NOT provide a definitive diagnosis.

    Analyze the following information for a ${patient.age}-year-old ${patient.gender.toLowerCase()} patient.

    Patient Symptoms:
    ---
    ${symptoms || 'Not provided.'}
    ---

    Physician's Examination Notes:
    ---
    ${notes || 'Not provided.'}
    ---

    Based on the information, provide a concise summary, a list of potential diagnoses for the physician to consider, and a list of suggested next steps (like specific tests or lifestyle recommendations).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
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

    const jsonText = response.text.trim();
    const parsedResponse: AISuggestion = JSON.parse(jsonText);
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get AI suggestions.");
  }
};

export { getAISuggestions };