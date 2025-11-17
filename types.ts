export enum ClothingCategory {
  TOP = "Top",
  BOTTOM = "Bottom",
  OUTERWEAR = "Outerwear",
  FOOTWEAR = "Footwear",
  ACCESSORY = "Accessory",
  DRESS = "Dress"
}

export enum Season {
  SPRING = "Spring",
  SUMMER = "Summer",
  AUTUMN = "Autumn",
  WINTER = "Winter",
  ALL_SEASON = "All-Season"
}

export enum Formality {
  CASUAL = "Casual",
  SMART_CASUAL = "Smart Casual",
  BUSINESS_CASUAL = "Business Casual",
  FORMAL = "Formal",
  SPORT = "Sport"
}

export enum StylePreference {
  CLASSIC = "Classic",
  MODERN = "Modern",
  SPORTY = "Sporty",
  CASUAL = "Casual",
  MINIMALIST = "Minimalist",
  VINTAGE = "Vintage",
  BOHEMIAN = "Bohemian"
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  UNISEX = "Unisex",
}

export enum Fit {
  SKINNY = "Skinny",
  SLIM = "Slim",
  REGULAR = "Regular",
  LOOSE = "Loose",
  OVERSIZED = "Oversized",
}

export enum Layering {
  BASE = "Base",
  MID = "Mid",
  OUTER = "Outer",
}

export interface ColorDetail {
    type: 'Primary' | 'Secondary' | 'Accent';
    name: string;
    hex: string;
}

export interface UserProfile {
  height: string;
  weight: string;
  stylePreferences: StylePreference[];
  favoriteColors: string[];
  photoUrl: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  category: ClothingCategory;
  gender: Gender;
  colors: ColorDetail[];
  tags: string[];
  fabric: string;
  texture: string;
  season: Season;
  formality: Formality;
  fit: Fit;
  layering: Layering;
  isAvailable: boolean;
}

export interface Outfit {
  items: ClothingItem[];
  reasoning: string;
  occasion: string;
}

// For Gemini API JSON schema
export interface AnalyzedClothingItem {
  name: string;
  category: ClothingCategory;
  gender: Gender;
  colors: ColorDetail[];
  tags: string[];
  fabric: string;
  texture: string;
  season: Season;
  formality: Formality;
  fit: Fit;
  layering: Layering;
}