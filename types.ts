

export enum CardType {
  Noun = 'Noun',
  Verb = 'Verb',
  Particle = 'Particle',
  Adjective = 'Adjective',
  Adverb = 'Adverb',
  AuxVerb = 'AuxVerb'
}

export interface CardData {
  id: string;
  text: string;
  type: CardType;
  tags: string[];
  rarity: number;
}

// Expanded Expression Types
export type CharacterExpression = 'normal' | 'happy' | 'sad' | 'angry' | 'blush' | 'bored' | 'lookaway' | 'annoyed';

export interface CharacterAssets {
    profile: string;
    ending: string;
    summer: Record<CharacterExpression, string>;
    winter: Record<CharacterExpression, string>;
}

export interface CharacterData {
  id: string;
  name: string;
  grade: number;
  positiveTags: string[];
  negativeTags: string[];
  affection: number;
  description: string; 
  visualTraits: string;
  
  // Enhanced Persona Info
  secrets: string[];
  worries: string[];
  hobbiesDetail: string;
  tone: string; 
  voiceConfig: string; 
  fallbackImageUrl: string;
  waitingMessages: string[];
  meetingStory: string;
  
  // Static Assets Mapping
  assets: CharacterAssets;
  
  // Profile Stats
  height: string;
  birthday: string;
  bloodType: string;
}

export interface EvaluationResult {
  generatedSentence: string;
  baseScore: number;
  affectionChange: number;
  reactionId: string; 
  aiResponseText?: string;
}

export enum TimeSlot {
  Morning = 'Morning',
  Lunch = 'Lunch',
  AfterSchool = 'AfterSchool',
  Night = 'Night'
}

export enum LocationType {
  Classroom = 'Classroom',
  Rooftop = 'Rooftop',
  Corridor = 'Corridor',
  Station = 'Station',
  Park = 'Park',
  Library = 'Library',
  Gym = 'Gym',
  Beach = 'Beach',
  Shrine = 'Shrine',
  Cafe = 'Cafe',
  Mall = 'Mall',
  Pool = 'Pool',
  AmusementPark = 'AmusementPark',
  Karaoke = 'Karaoke',
  Arcade = 'Arcade',
  ConvenienceStore = 'ConvenienceStore',
  Bookstore = 'Bookstore',
  FastFood = 'FastFood',
  Riverbank = 'Riverbank',
  Aquarium = 'Aquarium'
}

export interface LocationData {
  id: LocationType;
  name: string;
  bgUrl: string; 
  bgmTheme: 'happy' | 'calm' | 'tense' | 'melancholy'; 
  availableMonths?: number[];
}

export interface SchoolEvent {
  id: string;
  month: number;
  title: string;
  description: string;
}
