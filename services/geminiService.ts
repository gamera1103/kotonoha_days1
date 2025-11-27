
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterData, CardType, CharacterExpression, LocationType } from "../types";
import { LOCATIONS } from "../constants";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Green Screen Background Removal using Flood Fill algorithm
// This preserves white clothes while removing green background
async function removeBackgroundAuto(
  imageSrc: string,
  tolerance: number = 60
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    // Timeout safety
    const timeout = setTimeout(() => {
        resolve(imageSrc); 
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Dynamic Background Color Detection (Sample Corners)
      const corners = [
        0, // Top-Left
        (w - 1) * 4, // Top-Right
        (h - 1) * w * 4, // Bottom-Left
        ((h - 1) * w + (w - 1)) * 4 // Bottom-Right
      ];

      let rBg = 0, gBg = 0, bBg = 0;
      corners.forEach(idx => {
          rBg += data[idx];
          gBg += data[idx+1];
          bBg += data[idx+2];
      });
      rBg /= 4; gBg /= 4; bBg /= 4;

      // Flood Fill Setup
      const stack: number[] = [];
      const visited = new Uint8Array(w * h);

      // Add border pixels that match background color to stack
      const isMatch = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return Math.abs(r - rBg) < tolerance && 
               Math.abs(g - gBg) < tolerance && 
               Math.abs(b - bBg) < tolerance;
      };

      // Top & Bottom rows
      for (let x = 0; x < w; x++) {
          const idxTop = (0 * w + x) * 4;
          if (isMatch(idxTop)) { stack.push(idxTop); visited[0 * w + x] = 1; }
          const idxBot = ((h - 1) * w + x) * 4;
          if (isMatch(idxBot)) { stack.push(idxBot); visited[(h - 1) * w + x] = 1; }
      }
      // Left & Right cols
      for (let y = 0; y < h; y++) {
          const idxLeft = (y * w + 0) * 4;
          if (isMatch(idxLeft) && visited[y * w + 0] === 0) { stack.push(idxLeft); visited[y * w + 0] = 1; }
          const idxRight = (y * w + (w - 1)) * 4;
          if (isMatch(idxRight) && visited[y * w + (w - 1)] === 0) { stack.push(idxRight); visited[y * w + (w - 1)] = 1; }
      }

      // Process Stack (Flood Fill)
      while (stack.length > 0) {
        const idx = stack.pop()!;
        
        // Make pixel transparent
        data[idx + 3] = 0;

        // Check neighbors
        const pixelIndex = idx / 4;
        const x = pixelIndex % w;
        const y = Math.floor(pixelIndex / w);

        const neighbors = [
          { nx: x + 1, ny: y },
          { nx: x - 1, ny: y },
          { nx: x, ny: y + 1 },
          { nx: x, ny: y - 1 }
        ];

        for (const { nx, ny } of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nIdx = (ny * w + nx) * 4;
            const nPixelIdx = ny * w + nx;
            if (visited[nPixelIdx] === 0 && isMatch(nIdx)) {
              visited[nPixelIdx] = 1;
              stack.push(nIdx);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    
    img.onerror = () => {
        clearTimeout(timeout);
        resolve(imageSrc);
    }
  });
}

// Model Fallback Logic for Image Generation
async function generateImageWithRetry(prompt: string, aspectRatio: string = "3:4"): Promise<string | null> {
    const models = [
        'gemini-2.5-flash-image', // Primary: Faster
        'gemini-3-pro-image-preview' // Secondary: Better quality, fallback
    ];

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
                }
            });
            
            // Extract image (iterate parts)
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        } catch (e) {
            console.warn(`Model ${model} failed for image gen:`, e);
            continue; // Try next model
        }
    }
    return null; // All failed
}

export const generateCharacterSprite = async (character: CharacterData, emotion: string = 'normal', month: number = 4): Promise<string | null> => {
  if (!process.env.API_KEY) return character.fallbackImageUrl;

  const isSummer = month >= 4 && month <= 10;
  // Uniform Prompt Logic
  const uniformDesc = isSummer 
    ? "wearing the Kotonoha High School summer uniform: a short-sleeved white dress shirt (crisp texture), a red tartan plaid pleated skirt (knee-length), and a lightweight cream-colored knit vest (optional), no blazer."
    : "wearing the Kotonoha High School winter uniform: a fitted navy blue blazer with a gold school emblem on the chest pocket, a crisp white button-up shirt underneath, a red tartan plaid pleated skirt (knee-length), and black loafers.";

  const expressionPromptMap: Record<string, string> = {
      'normal': 'neutral expression, calm look',
      'happy': 'laughing, big smile, joyful expression, closed eyes smile',
      'sad': 'sad expression, eyebrows furrowed, looking down, slight tears',
      'angry': 'angry expression, shouting, furrowed brows, pouting',
      'blush': 'heavily blushing face, shy, embarrassed, looking away',
      'bored': 'bored expression, sighing, dull eyes',
      'lookaway': 'looking away, avoiding eye contact, shy',
      'annoyed': 'annoyed expression, pouting, disgusted look'
  };

  const prompt = `
  (Masterpiece, Best Quality), visual novel character sprite, solo, 
  ${character.name}, ${character.visualTraits}.
  ${expressionPromptMap[emotion] || 'neutral expression'}.
  ${uniformDesc}
  Standing pose, facing viewer (or slight angle if shy).
  Anime cel shading, clean lines, high quality art.
  Background is solid green color #00FF00. 
  NO TEXT, NO LOGOS, NO LAYOUT ELEMENTS.
  `;

  const rawImage = await generateImageWithRetry(prompt, "3:4");
  if (!rawImage) return character.fallbackImageUrl;

  // Apply Green Screen Removal
  return await removeBackgroundAuto(rawImage);
};

export const generateBackgroundImage = async (locationId: string): Promise<string | null> => {
    const loc = LOCATIONS[locationId];
    
    // Check for local asset or blob URL or Google Drive
    if (loc.bgUrl && (loc.bgUrl.startsWith('/') || loc.bgUrl.startsWith('./') || loc.bgUrl.includes('/assets/') || loc.bgUrl.startsWith('assets/') || loc.bgUrl.startsWith('blob:') || loc.bgUrl.includes('drive.google.com'))) {
        return loc.bgUrl;
    }

    if (!process.env.API_KEY) {
         // Fallback logic if API key missing (e.g. Unsplash)
         return loc.bgUrl; 
    }

    if (!loc.prompt) return loc.bgUrl;

    const prompt = `
    ${loc.prompt}
    NO TEXT, NO WATERMARK.
    `;

    // Try AI generation
    // First attempt
    let bgImage = await generateImageWithRetry(prompt, "16:9");
    
    // If AI fails, use fallback URL (Unsplash)
    // We can also try Unsplash with different keywords if needed, but constants.ts has good urls.
    if (!bgImage) {
        return loc.bgUrl;
    }
    
    return bgImage;
};

export const generateCharacterInitiative = async (
    character: CharacterData,
    locationName: string,
    currentAffection: number,
    isConsultation: boolean = false
): Promise<{ text: string; keywords: string[]; topics: string[]; status: 'QUESTION' | 'WAITING' }> => {
    
    if (!process.env.API_KEY) {
        const fallbackMsg = character.waitingMessages 
            ? character.waitingMessages[Math.floor(Math.random() * character.waitingMessages.length)]
            : "ねえ、私のこと、どう思ってる？";
        return { text: fallbackMsg, keywords: ["好き", "かわいい", "普通"], topics: ["Emotion"], status: 'WAITING' };
    }

    try {
        let systemPrompt = `
        You are simulating a Japanese high school dating sim character.
        Character: ${character.name}
        Profile: ${character.description}
        Persona Tone: ${character.tone}
        Secrets: ${character.secrets.join(', ')}
        Worries: ${character.worries.join(', ')}
        Location: ${locationName}
        Affection: ${currentAffection}
        `;

        if (isConsultation) {
            systemPrompt += `
            CRITICAL TASK: The character trusts the protagonist enough to share a deep secret or worry.
            Choose one worry or secret and talk about it seriously or hesitantly.
            Ask for their advice or listening ear.
            `;
        } else {
            systemPrompt += `
            Task: Generate a line where the character speaks to the protagonist FIRST.
            If Status is 'QUESTION': Ask about hobbies, school, food, or current situation.
            If Status is 'WAITING': Ask a question about the protagonist's relationship with you or impression of you.
            `;
        }

        systemPrompt += `
        Output Requirements:
        1. "text": The character's spoken line (Japanese).
        2. "keywords": 2-3 specific Japanese keywords relevant to the answer.
        3. "topics": 1-2 General Topic Tags for card retrieval (e.g., "School", "Food", "Love", "Slang", "Action").
        4. "status": 'QUESTION' or 'WAITING'.
        Return strictly JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        status: { type: Type.STRING, enum: ['QUESTION', 'WAITING'] }
                    },
                    required: ["text", "keywords", "topics", "status"]
                }
            }
        });

        return JSON.parse(response.text!);
    } catch (error) {
        const fallbackMsg = character.waitingMessages[0];
        return { text: fallbackMsg, keywords: [], topics: [], status: 'WAITING' };
    }
};

export const generateInteraction = async (
    character: CharacterData,
    playerText: string,
    score: number,
    currentAffection: number,
    locationName: string,
    history: { speaker: string; text: string }[]
): Promise<{ playerLine: string; characterLine: string; reaction: string; status: 'QUESTION' | 'WAITING' }> => {
    if (!process.env.API_KEY) {
        return { playerLine: playerText, characterLine: "...", reaction: 'normal', status: 'WAITING' };
    }

    try {
        const historyText = history.map(h => `${h.speaker}: ${h.text}`).join('\n');
        const prompt = `
        You are a dialogue engine for a Japanese dating sim game.
        
        Context:
        - Character: ${character.name}
        - Profile: ${character.description}
        - Tone: ${character.tone}
        - Hobbies: ${character.hobbiesDetail}
        - Location: ${locationName}
        - Current Affection: ${currentAffection}
        - Player Cards Used: "${playerText}" (Interpreted as broken Japanese, your job is to guess the intent)
        - Match Score: ${score}
        
        History:
        ${historyText}

        Task:
        1. "playerLine": Rewrite the card text into natural Japanese speech contextually suitable for the protagonist.
        2. "characterLine": Character's response.
           - React appropriately to the player's interpreted intent.
           - Be conversational. It's okay if the conversation is a bit awkward or funny ("mismatch").
        3. "reaction": Choose visual expression: 'normal', 'happy', 'sad', 'angry', 'blush', 'bored', 'lookaway', 'annoyed'.
        4. "status": 'QUESTION' (follow-up) or 'WAITING' (end topic).

        Return strictly JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        playerLine: { type: Type.STRING },
                        characterLine: { type: Type.STRING },
                        reaction: { type: Type.STRING, enum: ['normal', 'happy', 'sad', 'angry', 'blush', 'bored', 'lookaway', 'annoyed'] },
                        status: { type: Type.STRING, enum: ['QUESTION', 'WAITING'] }
                    },
                    required: ["playerLine", "characterLine", "reaction", "status"]
                }
            }
        });

        return JSON.parse(response.text!);
    } catch (error) {
        return { playerLine: playerText, characterLine: "...", reaction: 'normal', status: 'WAITING' };
    }
};