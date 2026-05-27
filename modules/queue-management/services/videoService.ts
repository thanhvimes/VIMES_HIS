import { GoogleGenAI } from "@google/genai";

export const generateHospitalIntroVideo = async (customPrompt?: string): Promise<string | null> => {
  try {
    // Veo models require a paid API key. Ensure we get a fresh client instance.
    // The key is injected via process.env.API_KEY after the user selects it in the dialog.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Use custom prompt if provided, otherwise use default
    const prompt = customPrompt && customPrompt.trim() !== '' 
      ? customPrompt 
      : 'Cinematic wide shot of a futuristic, clean, and bright hospital lobby. Patients using digital kiosks. Friendly doctors walking. Sunlight streaming through glass windows. High quality, professional, 4k resolution.';

    // 1. Initiate Video Generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // 2. Poll for completion
    // Video generation can take time, we loop until done.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // 3. Get the download link
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("No video URI returned from API");
    }

    // 4. Fetch the actual video bytes using the API Key
    // The URI provided by the API is not directly accessible without the key.
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!videoResponse.ok) {
        throw new Error("Failed to download video bytes");
    }

    const blob = await videoResponse.blob();
    
    // 5. Create a local URL for the video player
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};