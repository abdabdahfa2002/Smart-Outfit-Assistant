
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ClothingItem, AnalyzedClothingItem, UserProfile, ClothingCategory, Gender, Season, Formality, Fit, Layering } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const base64ToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

export const analyzeClothingItem = async (imageBase64: string, mimeType: string): Promise<AnalyzedClothingItem> => {
  if (!navigator.onLine) {
    throw new Error("You are currently offline. Please check your internet connection and try again.");
  }
  const imagePart = base64ToGenerativePart(imageBase64, mimeType);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        imagePart,
        { text: "Analyze this clothing item and provide its details in JSON format. Your analysis must be comprehensive. Provide a specific, descriptive `name` for the item (e.g., 'Blue Denim Shorts', 'Graphic Print T-Shirt'). Then, identify its category, gender, colors (primary, secondary, and accent colors with names and hex codes), descriptive tags (including pattern, design details like zippers or logos), fabric, texture, fit, suitable season, formality level, and layering potential." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A specific, descriptive name for the item (e.g., 'Blue Denim Shorts')." },
          category: { type: Type.STRING, enum: Object.values(ClothingCategory), description: "The category of the clothing item." },
          gender: { type: Type.STRING, enum: Object.values(Gender), description: "The target gender for the item." },
          colors: { 
            type: Type.ARRAY,
            description: "List of prominent colors. The first should be the primary color.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Primary', 'Secondary', 'Accent'], description: "The role of the color (Primary, Secondary, or Accent)." },
                    name: { type: Type.STRING, description: "The common name of the color (e.g., 'Royal Blue')." },
                    hex: { type: Type.STRING, description: "The hex code of the color (e.g., '#4169E1')." }
                },
                required: ["type", "name", "hex"]
            }
          },
          tags: {
            type: Type.ARRAY,
            description: "A list of descriptive tags, including pattern (e.g., 'Striped'), details ('Zipper', 'Logo'), and style ('Color Block').",
            items: { type: Type.STRING }
          },
          fabric: { type: Type.STRING, description: "The primary material of the item (e.g., 'Cotton', 'Polyester')." },
          texture: { type: Type.STRING, description: "The surface texture of the fabric (e.g., 'Soft', 'Matte', 'Shiny')." },
          season: { type: Type.STRING, enum: Object.values(Season), description: "The suitable season for this item." },
          formality: { type: Type.STRING, enum: Object.values(Formality), description: "The formality level of the item." },
          fit: { type: Type.STRING, enum: Object.values(Fit), description: "The fit or cut of the item (e.g., 'Slim', 'Regular')." },
          layering: { type: Type.STRING, enum: Object.values(Layering), description: "How the item is best used in layering (Base, Mid, or Outer layer)." },
        },
        required: ["name", "category", "gender", "colors", "tags", "fabric", "texture", "season", "formality", "fit", "layering"],
      },
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as AnalyzedClothingItem;
};

export const getOutfitRecommendation = async (wardrobe: ClothingItem[], occasion: string, userProfile: UserProfile, mustUseItemId?: string): Promise<{ itemIds: string[]; reasoning: string; }> => {
  if (!navigator.onLine) {
    throw new Error("You are currently offline. Please check your internet connection and try again.");
  }
  const availableItems = wardrobe.filter(item => item.isAvailable);
  if (availableItems.length < 2 && !mustUseItemId) {
    throw new Error("Not enough available items in the wardrobe to create an outfit.");
  }
  
  const wardrobeJson = JSON.stringify(availableItems.map(
    ({ id, name, category, gender, colors, tags, fabric, texture, season, formality, fit, layering }) => 
    ({ id, name, category, gender, colors, tags, fabric, texture, season, formality, fit, layering })
  ));

  const userProfileContext = `
    - Style Preferences: ${userProfile.stylePreferences.length > 0 ? userProfile.stylePreferences.join(', ') : 'Not specified'}.
    - Favorite Colors: ${userProfile.favoriteColors.length > 0 ? userProfile.favoriteColors.join(', ') : 'Not specified'}.
    ${userProfile.height ? `- Height: ${userProfile.height} cm.` : ''}
    ${userProfile.weight ? `- Weight: ${userProfile.weight} kg.` : ''}
  `;

  const mustUseItemInstruction = mustUseItemId 
    ? `**Constraint:** You MUST include the item with ID "${mustUseItemId}" in your final selection. Build the rest of the outfit around this core piece.`
    : '';

  const prompt = `
    You are an expert personal fashion stylist. Your goal is to create a complete, stylish, and highly personalized outfit from a client's available wardrobe.

    **Client Profile:**
    ${userProfileContext}

    **Occasion:** "${occasion}"
    
    ${mustUseItemInstruction}

    **Available Wardrobe (JSON format, see full item details below):**
    ${wardrobeJson}

    **Styling Rules & Guidelines:**
    1.  **Outfit Completeness & Layering:** Select a cohesive set of items. Use the 'layering' property to build from a 'Base' layer outwards to an 'Outer' layer if necessary. An outfit must feel complete (e.g., a top, a bottom, footwear).
    2.  **One-Piece Garments:** If you select an item from the 'Dress' category (e.g., a dress, jumpsuit, bikini), treat it as the main outfit. Do not add conflicting top or bottom layers. Only add appropriate outerwear (like a jacket) or accessories.
    3.  **Color Coordination:** Create a harmonious palette using the detailed 'colors' list for each item. The primary color is the most important. Incorporate the user's favorite colors where appropriate.
    4.  **Pattern & Texture Mixing:** Use the 'tags' to identify patterns. Mix patterns of different scales. Use the 'texture' property to create interesting contrasts (e.g., a soft knit with smooth leather). Anchor patterned or textured items with simpler pieces.
    5.  **Fit & Style:** The 'fit' of items should combine to create a balanced silhouette. The overall outfit must align with the user's 'stylePreferences'.
    6.  **Contextual Appropriateness:** Match 'formality' to the occasion and 'fabric'/'season' to likely weather conditions.

    **Your Task:**
    Based on all the provided details, select the best combination of item IDs.

    **Output Format:**
    Provide your response as a JSON object with two keys: "itemIds" and "reasoning".
    - "itemIds": An array of strings, where each string is the ID of a selected clothing item.
    - "reasoning": A detailed paragraph explaining your choices. This reasoning MUST address:
      1.  **Occasion Suitability:** Why the items' formality and fabric choices are perfect for "${occasion}".
      2.  **Style & Fit:** How the outfit reflects the user's style and creates a flattering silhouette using the 'fit' of the items.
      3.  **Color, Pattern & Texture:** Justify the combination of colors, patterns (from tags), and textures.
      4.  **Layering & Completeness:** Explain how the layers work together to complete the look.
  `;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of IDs of the selected clothing items for the outfit."
          },
          reasoning: {
            type: Type.STRING,
            description: "A detailed explanation of why this outfit is suitable, addressing occasion, user style, and color coordination."
          }
        },
        required: ["itemIds", "reasoning"],
      },
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateVirtualTryOn = async (userPhotoUrl: string, outfitItems: ClothingItem[]): Promise<string> => {
    if (!navigator.onLine) {
        throw new Error("You are currently offline. Please check your internet connection and try again.");
    }
    const [header, base64Data] = userPhotoUrl.split(',');
    if (!header || !base64Data) {
        throw new Error("Invalid user photo data URL.");
    }
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    
    const userImagePart = base64ToGenerativePart(base64Data, mimeType);
    
    const outfitDescription = outfitItems.map(item => {
        const primaryColorName = item.colors.find(c => c.type === 'Primary')?.name || item.colors[0]?.name || '';
        return `a ${item.fit} ${primaryColorName} ${item.name} made of ${item.fabric} with a ${item.texture} texture`;
    }).join(', worn with ');


    const promptText = `
      You are a virtual fashion stylist. Your task is to realistically dress the person in the provided photo with a specific outfit.
      **Instructions:**
      1.  **Strictly Adhere to the Description:** You MUST use the exact clothing items described. Do not add any extra items, change colors, or modify the style, cut, or length of the garments.
      2.  **Preserve Identity and Background:** The original person (including their face, hair, and body shape) and the background of the photo must be preserved as much as possible. Only change the clothes.
      3.  **Be Realistic:** The final image should look natural and believable.
      
      **Outfit to apply:**
      A complete outfit consisting of: ${outfitDescription}.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-001',
        contents: {
            parts: [
                userImagePart,
                { text: promptText },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    const candidate = response.candidates?.[0];

    if (!candidate || !candidate.content || !candidate.content.parts) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
             throw new Error(`Image generation was blocked. Reason: ${blockReason}. Please try a different photo or outfit description.`);
        }
        throw new Error("Could not generate an image from the response. The model did not return valid content.");
    }

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Could not generate an image from the response.");
};