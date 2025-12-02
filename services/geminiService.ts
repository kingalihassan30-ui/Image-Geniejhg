import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends an image and a text prompt to Gemini 2.5 Flash Image ("Nano Banana") 
 * to generate an edited version of the image.
 */
export const editImageWithGemini = async (
  base64Data: string, 
  mimeType: string, 
  prompt: string
): Promise<{ imageData: string | null; textData: string | null }> => {
  
  try {
    // Strip the data URL prefix if present to get raw base64
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // The "Nano Banana" model
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Content,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // Note: Do not set responseMimeType or responseSchema for this model when generating images
    });

    return parseResponse(response);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Generates a new image from scratch using a text prompt.
 */
export const generateImageFromText = async (
  prompt: string
): Promise<{ imageData: string | null; textData: string | null }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    });

    return parseResponse(response);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Enhances a short prompt into a more descriptive and creative version.
 */
export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following image generation prompt to be more detailed, artistic, and descriptive. 
      Keep it effective for an AI image generator. Do not add any conversational text, just output the enhanced prompt.
      
      Original Prompt: "${originalPrompt}"`,
    });

    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Prompt Enhance Error:", error);
    return originalPrompt;
  }
};

/**
 * Helper to parse the Gemini response for images or text.
 */
const parseResponse = (response: any) => {
  let generatedImage: string | null = null;
  let generatedText: string | null = null;

  if (response.candidates && response.candidates.length > 0) {
    const content = response.candidates[0].content;
    if (content && content.parts) {
      for (const part of content.parts) {
        // Check for inline data (image)
        if (part.inlineData && part.inlineData.data) {
            generatedImage = `data:image/png;base64,${part.inlineData.data}`;
        } 
        // Check for text (refusals, explanations, etc.)
        else if (part.text) {
          generatedText = part.text;
        }
      }
    }
  }

  return { imageData: generatedImage, textData: generatedText };
}