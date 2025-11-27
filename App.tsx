
import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS, CARD_DATABASE, MAX_HAND_SIZE, MAX_SLOTS, LOCATIONS, MAX_TURNS, RESPONSE_CARDS, SCHOOL_EVENTS, MOVES_PER_DAY, CHARACTER_SITUATIONS, CHARACTER_FEELINGS, MAX_AFFECTION, MIN_AFFECTION, LOCATION_TAG_MAP, FIXED_LOCATIONS, TITLE_VIDEO_URL, getRandomFallbackImage } from './constants';
import { CardData, CharacterData, EvaluationResult, LocationType, TimeSlot, CharacterExpression } from './types';
import { drawBalancedCards, evaluateDialogue, createTemporaryCard, drawTopicCards, generateResponseHand } from './services/gameEngine';
import { generateInteraction, generateCharacterSprite, generateBackgroundImage, generateCharacterInitiative } from './services/geminiService';
import { soundService } from './services/soundService';
import { Card, EmptySlot } from './components/Card';
import { CharacterView } from './components/CharacterView';
import { VisualEffects } from './components/VisualEffects';
import { Heart, RefreshCw, Send, Sparkles, MessageCircle, AlertCircle, Settings, X, Calendar, Move, Smile, ChevronRight, SkipForward, MapPin, Home, User, ArrowLeft, Info, BookOpen, Key, Lock, Image as ImageIcon } from 'lucide-react';

enum GamePhase {
  Title,
  Map,
  Interaction,
  Result,
  EventCutIn,
  Ending
}

const IDLE_THRESHOLD_SECONDS = 20;

const REACTION_LABELS: Record<string, string> = {
    normal: '(通常)',
    happy: '(喜んでいる)',
    sad: '(悲しんでいる)',
    angry: '(怒っている)',
    blush: '(照れている)',
    bored: '(退屈そう)',
    lookaway: '(そっぽを向く)',
    annoyed: '(ムッとしている)'
};

const TRANSITIONS = ['transition-fade', 'transition-slide', 'transition-wipe'];

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.Title);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(TimeSlot.Morning);
  const [location, setLocation] = useState<LocationType | string>(LocationType.Classroom);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_DAY);
  
  const [affections, setAffections] = useState<Record<string, number>>({
    reina: 0,
    akane: 0,
    shiori: 0
  });

  // Track history of affections per month
  const [affectionHistory, setAffectionHistory] = useState<Record<string, number[]>>({
    reina: [],
    akane: [],
    shiori: []
  });

  // Track monthly encounter counts for balancing spawns
  const [monthlyEncounterCounts, setMonthlyEncounterCounts] = useState<Record<string, number>>({
      reina: 0, akane: 0, shiori: 0
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>('reina');
  const [currentReaction, setCurrentReaction] = useState<string>('normal');
  const [dialogueHistory, setDialogueHistory] = useState<{speaker: string, text: string}[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const [spriteCache, setSpriteCache] = useState<Record<string, string>>({});
  const [bgCache, setBgCache] = useState<Record<string, string>>({});
  
  // Transitions
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false);
  const [currentTransition, setCurrentTransition] = useState('');
  const [isCharacterVisible, setIsCharacterVisible] = useState(false);

  const [turnCount, setTurnCount] = useState(0);
  const [hand, setHand] = useState<CardData[]>([]);
  const [slots, setSlots] = useState<(CardData | null)[]>(Array(MAX_SLOTS).fill(null));

  const [turnOwner, setTurnOwner] = useState<'player' | 'character'>('character');
  const [conversationStatus, setConversationStatus] = useState<'QUESTION' | 'WAITING'>('WAITING');
  const [visualEffect, setVisualEffect] = useState<'none' | 'positive' | 'negative'>('none');

  const [idleTime, setIdleTime] = useState(0);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isConsultation, setIsConsultation] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAffectionModal, setShowAffectionModal] = useState(false);
  const [selectedCharacterDetail, setSelectedCharacterDetail] = useState<string | null>(null);
  const [volumes, setVolumes] = useState({ bgm: 0.5, sfx: 0.5 });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogueHistory]);

  // Apply volume changes immediately
  useEffect(() => {
    soundService.setVolumes(volumes.bgm, volumes.sfx);
  }, [volumes]);

  useEffect(() => {
    const handleActivity = () => setIdleTime(0);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    const timer = setInterval(() => {
        if (phase === GamePhase.Interaction && !isAiThinking && turnCount < MAX_TURNS && !isSceneTransitioning) setIdleTime(prev => prev + 1);
    }, 1000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(timer);
    };
  }, [phase, isAiThinking, turnCount, isSceneTransitioning]);

  useEffect(() => {
    if (idleTime > IDLE_THRESHOLD_SECONDS && !isInterrupted && phase === GamePhase.Interaction && turnCount < MAX_TURNS && !isSceneTransitioning) {
       handleInterruption();
    }
  }, [idleTime, isInterrupted, phase, turnCount, isSceneTransitioning]);

  // Load sprite when reaction changes if not cached
  useEffect(() => {
      const currentMonth = SCHOOL_EVENTS[currentEventIndex]?.month || 4;
      const cacheKey = `${activeCharacterId}_${currentReaction}_m${currentMonth}`;
      
      if (phase === GamePhase.Interaction && !spriteCache[cacheKey]) {
          generateCharacterSprite(CHARACTERS[activeCharacterId], currentReaction, currentMonth).then(url => {
              if (url) {
                  setSpriteCache(prev => ({ ...prev, [cacheKey]: url }));
              }
          });
      }
  }, [currentReaction, activeCharacterId, phase, currentEventIndex]);

  const handleInterruption = () => {
      if (isAiThinking || turnCount >= MAX_TURNS) return;
      setIsInterrupted(true);
      
      setSlots(Array(MAX_SLOTS).fill(null));

      const char = CHARACTERS[activeCharacterId];
      const fallbackMsg = char.waitingMessages 
          ? char.waitingMessages[Math.floor(Math.random() * char.waitingMessages.length)]
          : "ねえ、聞いてる？";
      
      setDialogueHistory(prev => [...prev, { speaker: char.name, text: fallbackMsg }]);
      setConversationStatus('QUESTION'); 
      soundService.playCardDraw();
      
      const newHand = generateResponseHand(CARD_DATABASE, RESPONSE_CARDS, MAX_HAND_SIZE);
      setHand(newHand);
      
      setCurrentReaction(prev => prev === 'normal' ? 'bored' : prev);
  };

  const determineCharacterSpawn = (loc: string, time: TimeSlot): string => {
    const candidates = Object.values(CHARACTERS);
    let bestChar = candidates[0];
    let maxWeight = -100;
    
    // Balanced shuffle
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    
    for (const char of shuffled) {
      let weight = 0;
      
      // Location Preference
      if (char.positiveTags.includes('Indoor') && [LocationType.Classroom, LocationType.Corridor, LocationType.Station, 'library', LocationType.Cafe, LocationType.Mall].includes(loc)) weight += 3;
      if (char.positiveTags.includes('Outdoor') && [LocationType.Rooftop, LocationType.Park, 'beach', 'gym', LocationType.Pool, LocationType.AmusementPark].includes(loc)) weight += 3;
      
      // Encounter Balancing (Inverse Weight)
      const count = monthlyEncounterCounts[char.id] || 0;
      weight += (5 - count) * 4; 

      // Affection Weight
      weight += affections[char.id] / 100;

      if (weight > maxWeight) {
        maxWeight = weight;
        bestChar = char;
      }
    }
    return bestChar.id;
  };

  const startGame = () => {
    setCurrentEventIndex(0); // Start from April
    setPhase(GamePhase.EventCutIn);
    setAffectionHistory({reina: [], akane: [], shiori: []});
    setMonthlyEncounterCounts({reina: 0, akane: 0, shiori: 0});
    soundService.playConfirm();
    soundService.startBGM('calm');
    setTimeout(() => {
       if (phase === GamePhase.EventCutIn) setPhase(GamePhase.Map); 
    }, 4000);
  };

  const resetGame = () => {
    setCurrentEventIndex(0);
    setAffections({ reina: 0, akane: 0, shiori: 0 });
    setAffectionHistory({reina: [], akane: [], shiori: []});
    setMonthlyEncounterCounts({reina: 0, akane: 0, shiori: 0});
    setPhase(GamePhase.Title);
    soundService.stopBGM();
  };

  const skipEvent = () => {
      setPhase(GamePhase.Map);
  }

  const advanceEvent = () => {
    setAffectionHistory(prev => {
        const next = {...prev};
        Object.keys(affections).forEach(key => {
            next[key] = [...(next[key] || []), affections[key]];
        });
        return next;
    });

    if (currentEventIndex === SCHOOL_EVENTS.length - 1) {
        setPhase(GamePhase.Ending);
        soundService.startBGM('melancholy');
        return;
    }

    const nextIndex = currentEventIndex + 1;
    setCurrentEventIndex(nextIndex);
    
    // Reset Monthly state
    setTurnCount(0);
    setMovesLeft(MOVES_PER_DAY); 
    setMonthlyEncounterCounts({reina: 0, akane: 0, shiori: 0});
    setPhase(GamePhase.EventCutIn);
    setDialogueHistory([]);
    setHand([]);
    soundService.startBGM('calm');

    setTimeout(() => {
        if (phase === GamePhase.EventCutIn) setPhase(GamePhase.Map);
    }, 4000);
  };

  const enterLocation = async (loc: string) => {
    if (movesLeft <= 0 && location !== loc) return; 

    soundService.playConfirm();
    if (location !== loc) setMovesLeft(prev => prev - 1);
    
    setLocation(loc);
    setPhase(GamePhase.Interaction);
    
    // 1. Start transition sequence
    const effect = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    setCurrentTransition(effect);
    setIsSceneTransitioning(true);
    setIsCharacterVisible(false); // Hide character immediately
    
    soundService.startBGM(LOCATIONS[loc].bgmTheme);
    
    // 2. Load Background
    if (!bgCache[loc]) {
      const bgUrl = await generateBackgroundImage(loc);
      if (bgUrl) setBgCache(prev => ({ ...prev, [loc]: bgUrl }));
    }

    const charId = determineCharacterSpawn(loc, timeSlot);
    setActiveCharacterId(charId);
    setMonthlyEncounterCounts(prev => ({...prev, [charId]: (prev[charId] || 0) + 1}));
    
    // 3. Wait for Scene Transition
    setTimeout(() => {
        setIsSceneTransitioning(false); 
        
        // Show situation text BEFORE showing character
        const sitData = CHARACTER_SITUATIONS[charId];
        const locationKey = loc as LocationType;
        const availableTexts = (sitData[locationKey] && sitData[locationKey].length > 0) 
            ? sitData[locationKey] 
            : sitData.default;
            
        const situation = availableTexts[Math.floor(Math.random() * availableTexts.length)];
        setDialogueHistory(prev => [...prev, { speaker: 'System', text: situation }]);

        // 4. Start loading character
        const currentMonth = SCHOOL_EVENTS[currentEventIndex]?.month || 4;
        const initKey = `${charId}_normal_m${currentMonth}`;
        
        const showCharacter = () => {
            setIsCharacterVisible(true); 
            startEncounter(charId);
        };

        if (!spriteCache[initKey]) {
            generateCharacterSprite(CHARACTERS[charId], 'normal', currentMonth).then(url => {
                if (url) setSpriteCache(prev => ({ ...prev, [initKey]: url }));
                setTimeout(showCharacter, 200);
            });
        } else {
             setTimeout(showCharacter, 200);
        }
    }, 1000); 
  };

  const startEncounter = async (charId: string) => {
    setSlots(Array(MAX_SLOTS).fill(null));
    setVisualEffect('none');
    setIsInterrupted(false);
    setCurrentReaction('normal');
    
    const affection = affections[charId];
    const triggerConsultation = affection > 200 && Math.random() > 0.7; 
    setIsConsultation(triggerConsultation);
    
    let initialHand = drawBalancedCards(CARD_DATABASE, 10, []);

    // Inject location-specific cards
    const locationTags = LOCATION_TAG_MAP[location] || [];
    if (locationTags.length > 0) {
        initialHand = drawTopicCards(CARD_DATABASE, initialHand, locationTags, 3);
    }

    setHand(initialHand);
    
    if (turnCount >= MAX_TURNS) {
        setConversationStatus('WAITING');
        return;
    }

    const isCharacterTurn = Math.random() > (0.4 + (affection / 600)) || triggerConsultation; 
    
    if (isCharacterTurn) {
        setTurnOwner('character');
        await runCharacterTurn(charId, initialHand, triggerConsultation);
    } else {
        setTurnOwner('player');
        setConversationStatus('WAITING');
    }
  };

  const runCharacterTurn = async (charId: string, currentHand: CardData[], consultation: boolean) => {
      setIsAiThinking(true);
      setSlots(Array(MAX_SLOTS).fill(null));

      const char = CHARACTERS[charId];
      if (consultation) soundService.playCardDraw();
      
      const initiative = await generateCharacterInitiative(char, LOCATIONS[location].name, affections[charId], consultation);
      setIsAiThinking(false);

      setDialogueHistory(prev => [...prev, { speaker: char.name, text: initiative.text }]);
      setConversationStatus(initiative.status);

      let newHand = [...currentHand];
      if (initiative.status === 'QUESTION') {
          newHand = generateResponseHand(CARD_DATABASE, RESPONSE_CARDS, MAX_HAND_SIZE);
      } else {
           if (initiative.topics && initiative.topics.length > 0) {
               newHand = drawTopicCards(CARD_DATABASE, newHand, initiative.topics, 4);
           }
           if (initiative.keywords && initiative.keywords.length > 0) {
               const contextCards = initiative.keywords.map(k => createTemporaryCard(k));
               for (let i = 0; i < contextCards.length; i++) {
                   if (i < newHand.length) newHand[i] = contextCards[i];
               }
           }
      }

      setHand(newHand);
      soundService.playCardDraw();
      setTurnOwner('player');
  };

  const triggerVisualEffect = (type: 'positive' | 'negative') => {
      setVisualEffect(type);
      setTimeout(() => setVisualEffect('none'), 3000);
  };

  const handleCardClick = (card: CardData) => {
    const firstEmptyIndex = slots.findIndex(s => s === null);
    if (firstEmptyIndex !== -1) {
      soundService.playConfirm();
      setIdleTime(0);
      const newSlots = [...slots];
      newSlots[firstEmptyIndex] = card;
      setSlots(newSlots);
      let newHand = hand.filter(c => c.id !== card.id);
      const replenished = drawBalancedCards(CARD_DATABASE, 1, newHand);
      newHand = [...newHand, ...replenished];
      setHand(newHand);
    }
  };

  const handleSlotClick = (index: number) => {
    const card = slots[index];
    if (card) {
      soundService.playCancel();
      setIdleTime(0);
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
      // Discard, do not return to hand
    }
  };

  const handleShuffle = () => {
    const currentAffection = affections[activeCharacterId];
    if (currentAffection <= MIN_AFFECTION) return;
    soundService.playCancel();
    setIdleTime(0);
    setAffections(prev => ({ ...prev, [activeCharacterId]: Math.max(MIN_AFFECTION, currentAffection - 1) }));
    triggerVisualEffect('negative'); 
    const newCards = drawBalancedCards(CARD_DATABASE, 10, []);
    setHand(newCards);
    setDialogueHistory(prev => [...prev, { speaker: 'System', text: 'カードを交換しました (好感度 -1)' }]);
  };

  const handleSend = async () => {
    const activeCards = slots.filter((c): c is CardData => c !== null);
    if (activeCards.length === 0) return;

    soundService.playConfirm();
    setIdleTime(0);
    setIsInterrupted(false);
    
    const currentChar = CHARACTERS[activeCharacterId];
    const currentAffection = affections[activeCharacterId];
    const currentLocationName = LOCATIONS[location].name;
    const result: EvaluationResult = evaluateDialogue(activeCards, currentChar, currentLocationName);
    
    const newAffection = Math.max(MIN_AFFECTION, Math.min(MAX_AFFECTION, currentAffection + result.affectionChange));
    setAffections(prev => ({ ...prev, [activeCharacterId]: newAffection }));

    if (result.affectionChange > 0) {
        soundService.playPositive();
        triggerVisualEffect('positive');
    } else if (result.affectionChange < 0) {
        soundService.playNegative();
        triggerVisualEffect('negative');
    }

    setIsAiThinking(true);
    const tempHistory = [...dialogueHistory];
    const aiInteraction = await generateInteraction(
      currentChar, result.generatedSentence, result.baseScore, newAffection, LOCATIONS[location].name, tempHistory
    );
    setIsAiThinking(false);

    setDialogueHistory(prev => [
      ...prev, 
      { speaker: 'あなた', text: `「${aiInteraction.playerLine}」` },
      { speaker: 'System', text: `(好感度 ${result.affectionChange > 0 ? '+' : ''}${result.affectionChange})` },
      { speaker: currentChar.name, text: aiInteraction.characterLine }
    ]);
    
    setConversationStatus(aiInteraction.status);
    setCurrentReaction(aiInteraction.reaction); 
    setSlots(Array(MAX_SLOTS).fill(null));

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    if (nextTurn >= MAX_TURNS) {
      setDialogueHistory(prev => [...prev, { speaker: 'System', text: '今月の会話はここまでです。' }]);
    } else {
        if (aiInteraction.status === 'QUESTION') {
            const nextHand = generateResponseHand(CARD_DATABASE, RESPONSE_CARDS, MAX_HAND_SIZE);
            setHand(nextHand);
        } else if (Math.random() > 0.6) {
             setTimeout(() => runCharacterTurn(activeCharacterId, hand, false), 2000);
        }
    }
  };

  const getFeelingMessage = (charId: string, currentScore: number) => {
      const ranges = CHARACTER_FEELINGS[charId] || [];
      const match = ranges.find(r => currentScore >= r.range[0] && currentScore <= r.range[1]);
      if (match && match.messages.length > 0) {
          return match.messages[Math.floor(Math.abs(Math.sin(currentScore * 99)) * match.messages.length)];
      }
      return "……";
  };

  const handleLocalBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const dataUrl = event.target.result as string;
                  setBgCache(prev => ({ ...prev, [location as string]: dataUrl }));
                  setShowSettings(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const renderAffectionModal = () => {
    if (!showAffectionModal) return null;
    return (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Heart className="text-pink-500 fill-pink-500"/> 好感度ステータス</h3>
                    <button onClick={() => { setShowAffectionModal(false); setSelectedCharacterDetail(null); }}><X className="text-slate-400"/></button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-4">
                    {selectedCharacterDetail ? (
                        // --- DETAIL VIEW ---
                        (() => {
                            const char = CHARACTERS[selectedCharacterDetail];
                            const currentScore = affections[char.id];
                            const currentMonth = SCHOOL_EVENTS[currentEventIndex]?.month || 4;
                            // Use asset
                            const spriteUrl = char.assets.profile;
                            
                            return (
                                <div className="animate-fade-in-up">
                                    <button 
                                        onClick={() => setSelectedCharacterDetail(null)}
                                        className="mb-4 text-slate-500 hover:text-pink-500 flex items-center gap-1 font-bold text-sm"
                                    >
                                        <ArrowLeft size={16}/> 一覧に戻る
                                    </button>
                                    
                                    <div className="relative w-full h-64 bg-slate-100 rounded-xl overflow-hidden mb-6 shadow-inner">
                                        <img src={spriteUrl} className="absolute w-full h-full object-contain" />
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
                                            <div className="text-2xl font-bold text-white">{char.name}</div>
                                            <div className="text-white/80 text-sm">高校{char.grade}年生</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Specs */}
                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-center">
                                            <div><div className="text-xs text-slate-400">身長</div><div className="font-bold text-slate-700">{char.height}</div></div>
                                            <div><div className="text-xs text-slate-400">誕生日</div><div className="font-bold text-slate-700">{char.birthday}</div></div>
                                            <div><div className="text-xs text-slate-400">血液型</div><div className="font-bold text-slate-700">{char.bloodType}</div></div>
                                        </div>

                                        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                                            <div className="flex items-center gap-2 text-pink-600 font-bold mb-2">
                                                <Info size={18}/> プロフィール
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{char.description}</p>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                                                <BookOpen size={18}/> 出会い
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{char.meetingStory}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                                 <div className="text-purple-600 font-bold text-xs mb-1 flex items-center gap-1"><Lock size={12}/> 悩み</div>
                                                 <p className="text-xs text-slate-600">{currentScore > 200 ? char.worries[0] : "???"}</p>
                                            </div>
                                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                 <div className="text-orange-600 font-bold text-xs mb-1 flex items-center gap-1"><Key size={12}/> 秘密</div>
                                                  <p className="text-xs text-slate-600">{currentScore > 300 ? char.secrets[0] : "???"}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                             <div className="font-bold text-slate-700 mb-2">趣味・特技</div>
                                             <p className="text-sm text-slate-600">{char.hobbiesDetail}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        // --- LIST VIEW ---
                        <div className="space-y-6">
                            {Object.values(CHARACTERS).map(char => {
                                const currentScore = affections[char.id];
                                const feeling = getFeelingMessage(char.id, currentScore);
                                const history = [...(affectionHistory[char.id] || []), currentScore]; 
                                
                                const graphHeight = 60;
                                const graphWidth = 200;
                                const step = graphWidth / 11; 
                                const points = history.map((val, i) => {
                                    const y = graphHeight - ((val + MAX_AFFECTION) / (MAX_AFFECTION * 2) * graphHeight); 
                                    return `${i * step},${y}`;
                                }).join(' ');

                                return (
                                    <div key={char.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                                        <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => setSelectedCharacterDetail(char.id)}>
                                            <div className="w-14 h-14 rounded-full bg-white border-2 border-pink-200 overflow-hidden shadow-sm flex-none relative group">
                                                 <img src={char.assets.profile} className="w-full h-full object-cover" /> 
                                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">詳細</div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    {char.name}
                                                    <ChevronRight size={16} className="text-slate-300"/>
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold">高校{char.grade}年生</div>
                                            </div>
                                            <div className="text-2xl font-bold text-pink-500">{currentScore}</div>
                                        </div>
                                        
                                        <div className="mb-3 relative h-[60px] w-full bg-white border border-slate-100 rounded overflow-hidden">
                                             <svg className="w-full h-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none">
                                                 <line x1="0" y1={graphHeight/2} x2={graphWidth} y2={graphHeight/2} stroke="#eee" strokeWidth="1" />
                                                 <polyline points={points} fill="none" stroke="#ec4899" strokeWidth="2" />
                                             </svg>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-pink-100 italic text-sm text-slate-600 relative">
                                            <span className="text-2xl text-pink-200 absolute -top-2 -left-1">❝</span>
                                            {feeling}
                                            <span className="text-2xl text-pink-200 absolute -bottom-4 -right-1">❞</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
             </div>
        </div>
    )
  }

  const renderSettingsModal = () => {
      if (!showSettings) return null;
      return (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Settings/> 設定</h3>
                    <button onClick={() => setShowSettings(false)}><X/></button>
                </div>
                
                <div className="mb-4">
                    <label className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                        <span>BGM Volume</span>
                        <span>{Math.round(volumes.bgm * 100)}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={volumes.bgm}
                        onChange={(e) => setVolumes(prev => ({...prev, bgm: parseFloat(e.target.value)}))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                </div>

                <div className="mb-6">
                    <label className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                        <span>SE Volume</span>
                        <span>{Math.round(volumes.sfx * 100)}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={volumes.sfx}
                        onChange={(e) => setVolumes(prev => ({...prev, sfx: parseFloat(e.target.value)}))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                </div>

                <div className="mb-6 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                        <ImageIcon size={16}/> 現在の背景を変更 (ローカル画像)
                    </label>
                    <p className="text-xs text-slate-400 mb-2">※ PC内の画像を選択して一時的に背景にできます</p>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLocalBgUpload}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                    />
                </div>

                <button onClick={() => setShowSettings(false)} className="w-full bg-slate-800 text-white py-3 rounded-full font-bold">閉じる</button>
             </div>
        </div>
      );
  }

  const renderCalendarModal = () => {
    if (!showCalendar) return null;
    return (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2"><Calendar/> 年間行事</h3>
                    <button onClick={() => setShowCalendar(false)}><X/></button>
                </div>
                <div className="space-y-3">
                    {SCHOOL_EVENTS.map((evt, idx) => (
                        <div key={evt.id} className={`p-3 rounded-lg border-l-4 ${idx === currentEventIndex ? 'bg-pink-50 border-pink-500 shadow-md' : 'bg-slate-50 border-slate-300 opacity-70'}`}>
                            <div className="font-bold text-slate-800">{evt.month}月: {evt.title}</div>
                            <div className="text-xs text-slate-500">{evt.description}</div>
                            {idx === currentEventIndex && <span className="text-xs font-bold text-pink-500 mt-1 block">◀ 現在</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
  }

  if (phase === GamePhase.EventCutIn) {
      const event = SCHOOL_EVENTS[currentEventIndex];
      return (
          <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white p-8 text-center animate-pulse relative">
              <div>
                  <h1 className="text-4xl font-bold mb-4 font-serif">{event.title}</h1>
                  <p className="text-xl opacity-80">{event.description}</p>
              </div>
              <button 
                  onClick={skipEvent}
                  className="absolute bottom-10 right-10 flex items-center gap-2 text-white/50 hover:text-white border border-white/20 rounded-full px-4 py-2"
              >
                  Skip <SkipForward size={16} />
              </button>
          </div>
      )
  }

  if (phase === GamePhase.Ending) {
      const bestCharId = Object.keys(affections).reduce((a, b) => affections[a] > affections[b] ? a : b);
      const bestChar = CHARACTERS[bestCharId];
      const score = affections[bestCharId];
      const success = score >= 80;

      // Use asset
      const spriteUrl = bestChar.assets.ending;

      return (
          <div className="h-screen w-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
               {spriteUrl ? (
                   <img src={spriteUrl} className="absolute inset-0 w-full h-full object-cover z-0" style={{objectPosition: "top center"}} />
               ) : (
                   <div className="absolute inset-0 bg-pink-100 z-0"/>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent z-10"></div>
               <div className="relative z-20 flex flex-col items-center justify-end h-full pb-16 px-6 text-center w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-4 font-serif text-pink-600 drop-shadow-md">卒業式</h1>
                    <h2 className="text-4xl font-bold text-slate-800 mb-6 drop-shadow-sm">{bestChar.name}</h2>
                    <div className="bg-white/90 p-6 rounded-xl border border-pink-200 shadow-xl w-full mb-8 backdrop-blur-sm">
                        {success ? (
                            <p className="text-slate-800 italic text-lg leading-relaxed">
                                「……ずっと、言いたかったの。<br/>
                                あなたと過ごした毎日が、私にとって一番の宝物だって。<br/>
                                ……好きです。これからも、ずっと一緒にいてくれませんか？」
                            </p>
                        ) : (
                            <p className="text-slate-600 text-lg leading-relaxed">
                                「卒業、おめでとうございます。<br/>
                                先輩といろんな話ができて楽しかったです。<br/>
                                ……それじゃあ、お元気で。」
                            </p>
                        )}
                    </div>
                    <button onClick={resetGame} className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <Home size={20}/> タイトルへ戻る
                    </button>
                    <div className="mt-4 text-slate-400 font-bold text-xs">THE END</div>
               </div>
          </div>
      )
  }

  if (phase === GamePhase.Title) {
    return (
      <div className="h-screen w-full max-w-md mx-auto bg-gradient-to-br from-pink-100 to-blue-100 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        {/* Title Video Background */}
        <div className="absolute inset-0 z-0">
            <video 
                src={TITLE_VIDEO_URL}
                autoPlay muted loop playsInline 
                className="w-full h-full object-cover opacity-60"
            />
        </div>
        <div className="relative z-10">
            <h1 className="text-5xl font-bold text-slate-800 mb-2 font-serif tracking-tighter drop-shadow-lg">コトノハ<br/><span className="text-pink-500">Days</span></h1>
            <p className="text-slate-600 mb-8 font-bold text-lg drop-shadow-md">言葉で心をつなぐRPG</p>
            <button onClick={startGame} className="bg-slate-800 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform animate-bounce">はじめる</button>
        </div>
      </div>
    );
  }

  // --- Map Phase ---
  if (phase === GamePhase.Map) {
      const currentMonth = SCHOOL_EVENTS[currentEventIndex].month;
      
      const allValid = Object.values(LOCATIONS).filter(loc => 
        !loc.availableMonths || loc.availableMonths.includes(currentMonth)
      );
      
      const fixed = allValid.filter(loc => FIXED_LOCATIONS.includes(loc.id as LocationType));
      const others = allValid.filter(loc => !FIXED_LOCATIONS.includes(loc.id as LocationType));
      
      const start = (currentEventIndex * 3) % others.length;
      const randomized = [
          ...others.slice(start, start + 6),
          ...others.slice(0, Math.max(0, 6 - (others.length - start)))
      ].slice(0, 6);

      const availableLocations = [...fixed, ...randomized];

    return (
      <div className="h-screen w-full max-w-md mx-auto bg-slate-50 flex flex-col relative">
        <header className="absolute top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md shadow-sm z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowCalendar(true)}>
             <Calendar size={18} className="text-slate-400" />
             <div className="flex flex-col leading-none">
               <span className="text-xs font-bold text-pink-500">{SCHOOL_EVENTS[currentEventIndex].title}</span>
               <span className="text-sm font-bold text-slate-600 flex items-center gap-1">{currentMonth}月</span>
             </div>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1">
              <Move size={12}/> 残り移動: {movesLeft}
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400"><Settings size={20} /></button>
        </header>

        {renderCalendarModal()}
        {renderSettingsModal()}
        {renderAffectionModal()}
        
        {/* Map Scroll Container */}
        <div className="flex-1 flex flex-col items-center justify-start gap-4 p-4 overflow-y-auto no-scrollbar w-full relative">
            <div className="w-full h-[100px] shrink-0" />
            
            <div className="w-full bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <h3 className="text-xs font-bold text-slate-400">みんなの好感度</h3>
                </div>
                <button onClick={() => setShowAffectionModal(true)} className="text-xs font-bold text-pink-500 flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
                    <Heart size={12}/> 詳細を見る
                </button>
            </div>

            {availableLocations.map((loc) => (
                <button 
                    key={loc.id}
                    onClick={() => enterLocation(loc.id)}
                    disabled={movesLeft <= 0 && location !== loc.id}
                    className="w-full h-24 min-h-[6rem] rounded-xl overflow-hidden relative shadow-md group hover:shadow-xl transition-all disabled:opacity-50 disabled:grayscale shrink-0"
                >
                    <img 
                        src={loc.bgUrl} 
                        onError={(e) => {
                             console.error("Failed to load map thumbnail:", loc.bgUrl);
                             e.currentTarget.src = getRandomFallbackImage([loc.name, 'anime', 'scenery']); 
                        }}
                        className="w-full h-full object-cover opacity-80" 
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold text-shadow">{loc.name}</span>
                    </div>
                </button>
            ))}
            
            {movesLeft < MOVES_PER_DAY && (
                 <button onClick={() => setPhase(GamePhase.Interaction)} className="w-full bg-pink-500 text-white py-4 rounded-xl font-bold shadow-lg mt-4 mb-8 shrink-0">
                    会話に戻る
                </button>
            )}
            
            <div className="h-10 shrink-0"></div>
        </div>
      </div>
    );
  }

  // --- Interaction Phase ---

  const currentBg = bgCache[location] || LOCATIONS[location].bgUrl;
  const currentCharacter = CHARACTERS[activeCharacterId];
  const currentMonth = SCHOOL_EVENTS[currentEventIndex]?.month || 4;
  
  // Use static asset call synchronously for rendering (or use memo if heavy)
  let currentSpriteUrl = null;
  const isSummer = currentMonth >= 4 && currentMonth <= 10;
  const expr = (['normal', 'happy', 'sad', 'angry', 'blush', 'bored', 'lookaway', 'annoyed'].includes(currentReaction) ? currentReaction : 'normal') as CharacterExpression;
  if (isSummer) currentSpriteUrl = currentCharacter.assets.summer[expr];
  else currentSpriteUrl = currentCharacter.assets.winter[expr];

  return (
    <div className={`h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-slate-200 ${isSceneTransitioning ? currentTransition : ''}`}>
      {renderSettingsModal()}
      {renderAffectionModal()}
      <VisualEffects type={visualEffect} />

      {/* --- SCENE AREA (Left / Top) --- */}
      <div className="w-full md:w-1/2 h-full relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={currentBg} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-100`} 
          alt="bg"
          onError={(e) => {
             console.error("Failed to load scene background:", currentBg);
             e.currentTarget.src = getRandomFallbackImage(['school', 'anime', 'scenery']);
          }}
        />
        
        {/* Character Layer */}
        <div className="absolute top-0 bottom-0 w-full z-20 flex justify-center items-end pointer-events-none">
             <CharacterView 
                character={currentCharacter} 
                reaction={currentReaction} 
                imageUrl={currentSpriteUrl} 
                isVisible={isCharacterVisible}
             />
        </div>

        {/* Emotion & Info Overlay */}
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
             <div className="bg-white/80 backdrop-blur text-slate-800 px-3 py-1 rounded-lg shadow-sm border border-slate-200 inline-flex items-center gap-1">
                <Smile size={14} className="text-pink-500"/>
                <span className="text-xs font-bold">{REACTION_LABELS[currentReaction] || '(通常)'}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm w-fit">
               <Heart className="fill-pink-500 text-pink-500" size={16}/>
               <span className="font-bold text-slate-700">{affections[activeCharacterId]}</span>
            </div>
        </div>

        {/* Header Controls (Overlaid on Scene) */}
        <div className="absolute top-4 right-4 z-30 flex gap-2">
           <button 
             onClick={() => setShowAffectionModal(true)} 
             className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-pink-500 shadow-sm hover:bg-white"
           >
              <User size={20} />
           </button>
           <button 
             onClick={() => setPhase(GamePhase.Map)} 
             disabled={movesLeft <= 0}
             className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-600 disabled:opacity-30 shadow-sm hover:bg-white"
           >
              <MapPin size={20} />
           </button>
           <button 
             onClick={() => setShowSettings(true)}
             className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-600 shadow-sm hover:bg-white"
           >
              <Settings size={20} />
           </button>
        </div>
        
        <div className="absolute top-20 right-4 bg-black/40 text-white text-xs px-3 py-1 rounded-full z-20 backdrop-blur-sm font-bold tracking-wider">
           TURN {turnCount} / {MAX_TURNS}
        </div>
      </div>

      {/* --- INTERACTION AREA (Right / Bottom Overlay) --- */}
      <div className="absolute bottom-0 md:relative md:w-1/2 md:h-full bg-white/50 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-30 flex flex-col mx-[20px] md:mx-0 rounded-t-[2rem] md:rounded-none h-[60%] md:h-auto border-t border-white/40 md:border-l md:border-t-0 w-[calc(100%-40px)] md:w-1/2">
        
        {/* Dialogue History */}
        <div className="h-[60%] border-b border-white/50 p-4 overflow-y-auto no-scrollbar flex flex-col gap-2 shadow-inner bg-white/30">
           {dialogueHistory.length === 0 && <div className="text-center text-xs text-slate-500 mt-4">会話ログはまだありません</div>}
           {dialogueHistory.map((msg, idx) => (
               <div key={idx} className={`text-sm ${msg.speaker === 'あなた' ? 'text-right text-slate-600 italic' : (msg.speaker === 'System' ? 'text-center text-xs text-pink-500 font-bold' : 'text-left text-slate-900')}`}>
                   {msg.speaker !== 'System' && <span className="font-bold text-xs text-slate-500 block mb-0.5">{msg.speaker}</span>}
                   <span className={`px-3 py-1.5 rounded-xl inline-block whitespace-pre-wrap shadow-sm ${msg.speaker === 'あなた' ? 'bg-white/90 border border-slate-200' : (msg.speaker === 'System' ? 'bg-transparent shadow-none p-0' : 'bg-pink-100/90 border border-pink-200')}`}>
                       {msg.text}
                   </span>
               </div>
           ))}
           {isAiThinking && <div className="text-xs text-pink-600 animate-pulse font-bold ml-2">{currentCharacter.name}が考えています...</div>}
           <div ref={chatEndRef} />
        </div>

        {/* Card Controls */}
        <div className="flex-1 flex flex-col p-2 bg-white/50">
            {turnCount >= MAX_TURNS ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <p className="text-slate-700 text-sm font-bold text-center drop-shadow-sm">
                        今月の行動は終了しました。<br/>次のイベントへ進みますか？
                    </p>
                    <button 
                        onClick={advanceEvent}
                        className="w-full max-w-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 animate-bounce"
                    >
                        次のイベントへ <ChevronRight/>
                    </button>
                </div>
            ) : (
                <>
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-2 mb-1">
                         <div className="flex items-center gap-2">
                            <span className={conversationStatus === 'QUESTION' ? 'text-pink-600 animate-pulse text-xs font-bold flex items-center gap-1' : 'text-slate-500 text-xs font-bold flex items-center gap-1'}>
                                {conversationStatus === 'QUESTION' ? <AlertCircle size={12}/> : <MessageCircle size={12}/>}
                                {isConsultation ? '相談中' : (conversationStatus === 'QUESTION' ? '返答待ち' : '様子見')}
                            </span>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={handleShuffle} disabled={affections[activeCharacterId] <= MIN_AFFECTION} className="text-xs font-bold text-slate-500 bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-white"><RefreshCw size={10}/>交換</button>
                             <button onClick={handleSend} disabled={slots.every(s => s === null) || isAiThinking} className="bg-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1 disabled:opacity-50 hover:bg-pink-600"><Send size={12} /> 話す</button>
                         </div>
                    </div>

                    {/* Slots */}
                    <div className="flex justify-center gap-1 mb-2 bg-white/60 p-2 rounded-lg border border-white/50">
                        {slots.map((slotCard, i) => (
                            slotCard ? <Card key={`${slotCard.id}_slot`} card={slotCard} isSlot onClick={() => handleSlotClick(i)} /> : <EmptySlot key={i} onClick={() => {}} /> 
                        ))}
                    </div>

                    {/* Hand (Fixed Height Container) */}
                    <div className="flex-none h-[110px] overflow-y-auto no-scrollbar bg-white/30 rounded-lg p-1">
                        <div className="grid grid-cols-5 gap-1 place-items-stretch">
                            {hand.map((card) => <Card key={card.id} card={card} onClick={() => handleCardClick(card)} />)}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
