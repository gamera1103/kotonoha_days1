
import { CardData, CardType, CharacterData, EvaluationResult } from '../types';
import { CONTEXT_NOUNS, SPECIAL_COMBOS } from '../constants';

/**
 * Draws random cards but prioritizes types missing from the hand to ensure sentence construction is possible.
 */
export const drawBalancedCards = (pool: CardData[], count: number, existingCards: CardData[] = []): CardData[] => {
  const hand: CardData[] = [];
  
  // Check what types are missing in the hand
  const hasNoun = existingCards.some(c => c.type === CardType.Noun);
  const hasVerb = existingCards.some(c => c.type === CardType.Verb);
  const hasParticle = existingCards.some(c => c.type === CardType.Particle);

  const missingTypes: CardType[] = [];
  if (!hasNoun) missingTypes.push(CardType.Noun);
  if (!hasVerb) missingTypes.push(CardType.Verb);
  if (!hasParticle) missingTypes.push(CardType.Particle);

  // Existing IDs to avoid duplicates
  const existingBaseIds = new Set(existingCards.map(c => c.id.split('_')[0]));
  const availablePool = pool.filter(card => !existingBaseIds.has(card.id));

  // 1. Fill missing types first (one for each missing type)
  for (const type of missingTypes) {
    if (hand.length >= count) break;
    const candidates = availablePool.filter(c => c.type === type);
    if (candidates.length > 0) {
        const card = candidates[Math.floor(Math.random() * candidates.length)];
        hand.push({ ...card, id: `${card.id}_${Date.now()}_bal` });
        existingBaseIds.add(card.id); // Prevent re-picking immediately
    }
  }

  // 2. Fill the rest randomly
  const remainingCount = count - hand.length;
  if (remainingCount > 0) {
     const remainingPool = availablePool.filter(c => !existingBaseIds.has(c.id)); // Refresh filter
     const shuffled = [...remainingPool].sort(() => Math.random() - 0.5);
     
     for (let i = 0; i < remainingCount && i < shuffled.length; i++) {
        const card = shuffled[i];
        hand.push({ ...card, id: `${card.id}_${Date.now()}_rnd_${i}` });
     }
  }

  return hand;
};

/**
 * Generates a specific hand for responding to character questions.
 * Guarantees Verbs, Adjectives, Yes/No, and Context Nouns.
 */
export const generateResponseHand = (pool: CardData[], responsePool: CardData[], count: number): CardData[] => {
  const hand: CardData[] = [];
  const timestamp = Date.now();

  // 1. Guaranteed Yes/No (Affirmative/Negative) - Pick 1 affirmative, 1 negative
  const affirmative = responsePool.filter(c => c.tags.includes('Positive') || c.tags.includes('Agreement'));
  const negative = responsePool.filter(c => c.tags.includes('Negative') || c.tags.includes('Denial'));
  
  if (affirmative.length > 0) {
      const c = affirmative[Math.floor(Math.random() * affirmative.length)];
      hand.push({ ...c, id: `${c.id}_yes_${timestamp}` });
  }
  if (negative.length > 0) {
      const c = negative[Math.floor(Math.random() * negative.length)];
      hand.push({ ...c, id: `${c.id}_no_${timestamp}` });
  }

  // 2. Guaranteed Context Nouns (Topic) - Pick 2 (MUST have at least 1)
  const shuffledContext = [...CONTEXT_NOUNS].sort(() => Math.random() - 0.5);
  for(let i=0; i<2 && i<shuffledContext.length; i++) {
    hand.push({ ...shuffledContext[i], id: `${shuffledContext[i].id}_ctx_${timestamp}` });
  }

  // 3. Guaranteed Verbs (Action/Think) - Pick 1-2
  const verbs = pool.filter(c => c.type === CardType.Verb);
  const shuffledVerbs = verbs.sort(() => Math.random() - 0.5);
  for(let i=0; i<2 && i<shuffledVerbs.length; i++) {
    hand.push({ ...shuffledVerbs[i], id: `${shuffledVerbs[i].id}_verb_${timestamp}` });
  }

  // 4. Fill rest with Particles/Aux/Nouns
  const existingIds = new Set(hand.map(c => c.id.split('_')[0]));
  const remainingCount = count - hand.length;
  
  const restPool = pool.filter(c => !existingIds.has(c.id));
  const shuffledRest = restPool.sort(() => Math.random() - 0.5);

  for(let i=0; i<remainingCount && i<shuffledRest.length; i++) {
      hand.push({ ...shuffledRest[i], id: `${shuffledRest[i].id}_fill_${timestamp}` });
  }

  return hand;
};

/**
 * Searches the database for cards matching the requested topics (context) and adds them to hand.
 * Replaces random cards in the hand with topic-relevant cards.
 */
export const drawTopicCards = (pool: CardData[], currentHand: CardData[], topics: string[], count: number): CardData[] => {
    // Flatten tags for loose matching
    const relevantCards = pool.filter(card => 
        card.tags.some(tag => topics.some(topic => tag.toLowerCase().includes(topic.toLowerCase())))
    );

    // If no relevant cards found, fallback to just creating temp cards later or doing nothing
    if (relevantCards.length === 0) return currentHand;

    const newHand = [...currentHand];
    
    // Pick unique relevant cards
    const pickedCards: CardData[] = [];
    const shuffledRelevant = [...relevantCards].sort(() => Math.random() - 0.5);
    
    // Avoid duplicates in hand
    const existingBaseIds = new Set(currentHand.map(c => c.id.split('_')[0]));
    
    for (const card of shuffledRelevant) {
        if (pickedCards.length >= count) break;
        if (!existingBaseIds.has(card.id)) {
            pickedCards.push({ ...card, id: `${card.id}_${Date.now()}_ctx` });
            existingBaseIds.add(card.id);
        }
    }

    // Replace random cards in hand (prefer replacing duplicates or less useful cards if implemented, currently just random slots)
    // We try to keep Particles and AuxVerbs as they are structural
    const replacementIndices: number[] = [];
    newHand.forEach((card, idx) => {
        if (card.type !== CardType.Particle && card.type !== CardType.AuxVerb) {
            replacementIndices.push(idx);
        }
    });

    // Shuffle indices
    const shuffledIndices = replacementIndices.sort(() => Math.random() - 0.5);

    for (let i = 0; i < pickedCards.length; i++) {
        if (i < shuffledIndices.length) {
            newHand[shuffledIndices[i]] = pickedCards[i];
        }
    }

    return newHand;
};

/**
 * Creates a temporary card from a keyword (used for AI-suggested context).
 */
export const createTemporaryCard = (word: string, type: CardType = CardType.Noun): CardData => {
    return {
        id: `temp_${word}_${Date.now()}`,
        text: word,
        type: type,
        tags: ['Context', 'AiGenerated'],
        rarity: 2
    };
};

export const evaluateDialogue = (
  selectedCards: CardData[],
  targetChar: CharacterData,
  currentLocationName?: string
): EvaluationResult => {
  let score = 0;
  let sentence = "";

  // 1. Concatenation
  selectedCards.forEach(card => {
    sentence += card.text + ""; 
  });
  sentence = sentence.trim();

  const selectedIds = selectedCards.map(c => c.id.split('_')[0]); // Base IDs for combo check
  const selectedText = selectedCards.map(c => c.text);

  // 2. Base Tag Matching
  selectedCards.forEach(card => {
    const hasPositive = card.tags.some(tag => targetChar.positiveTags.includes(tag));
    const hasNegative = card.tags.some(tag => targetChar.negativeTags.includes(tag));

    if (hasPositive) score += 5;
    if (hasNegative) score -= 8; // Stronger penalty for mismatch
  });

  // 3. Special Combo Bonus
  const combos = SPECIAL_COMBOS[targetChar.id] || [];
  let comboBonus = 0;
  combos.forEach(combo => {
      // Check if all IDs in combo are present in selectedIds
      // Note: card.id has suffixes, so we matched Base IDs above.
      // Combo definitions in constants use Base IDs (e.g. 'ctx_game').
      const isMatch = combo.every(id => selectedIds.includes(id));
      if (isMatch) comboBonus += 15;
  });
  if (comboBonus > 0) score += comboBonus;

  // 4. Persona Keyword Matching (Secrets / Worries)
  // Simple substring check: does any card text appear in secrets/worries?
  let personaBonus = 0;
  const deepKeywords = [...targetChar.secrets, ...targetChar.worries].join(' ');
  selectedText.forEach(text => {
      if (deepKeywords.includes(text) && text.length > 1) { // Avoid 1 char matches
          personaBonus += 20;
      }
  });
  score += personaBonus;

  // 5. Grammar Bonus
  let hasGrammarCombo = false;
  const types = selectedCards.map(c => c.type);
  if (types.includes(CardType.Noun) && types.includes(CardType.Particle) && types.includes(CardType.Verb)) {
      hasGrammarCombo = true;
      score += 10;
  }
  if (types.includes(CardType.Adjective) && types.includes(CardType.Noun)) {
      score += 5;
  }

  // 6. Context Multiplier
  if (hasGrammarCombo) {
    score = Math.round(score * 1.2);
  }

  // 7. Clamp
  const affectionDelta = Math.max(-25, Math.min(score, 35)); // Expanded range for bigger impact

  // Determine Reaction ID
  let reactionId = 'normal';
  if (affectionDelta >= 20) reactionId = 'happy';
  else if (affectionDelta >= 10) reactionId = 'blush';
  else if (affectionDelta <= -10) reactionId = 'angry';
  else if (affectionDelta <= -20) reactionId = 'bored';

  return {
    generatedSentence: sentence,
    baseScore: score,
    affectionChange: affectionDelta,
    reactionId
  };
};
