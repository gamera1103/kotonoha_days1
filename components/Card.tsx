
import React from 'react';
import { CardData, CardType } from '../types';

interface CardProps {
  card: CardData;
  onClick?: () => void;
  isSelected?: boolean;
  isSlot?: boolean;
}

const typeColors = {
  [CardType.Noun]: 'bg-blue-100 border-blue-300 text-blue-900',
  [CardType.Verb]: 'bg-red-100 border-red-300 text-red-900',
  [CardType.Particle]: 'bg-slate-100 border-slate-300 text-slate-600',
  [CardType.Adjective]: 'bg-green-100 border-green-300 text-green-900',
  [CardType.Adverb]: 'bg-purple-100 border-purple-300 text-purple-900',
  [CardType.AuxVerb]: 'bg-orange-100 border-orange-300 text-orange-900',
};

export const Card: React.FC<CardProps> = ({ card, onClick, isSelected, isSlot }) => {
  const baseClass = "relative flex flex-col items-center justify-center border-2 rounded-lg shadow-sm cursor-pointer transition-all duration-200 select-none";
  
  // Adjusted sizes
  // isSlot: Compact for drop zone (Fixed)
  // default (Hand): Flexible width to fit grid with margins
  const sizeClass = isSlot 
    ? "w-14 h-16 text-xs flex-none" 
    : "w-full min-w-0 h-[50px] text-[0.65rem] hover:-translate-y-1";
    
  const colorClass = typeColors[card.type] || 'bg-gray-100';
  const selectedClass = isSelected ? "ring-2 ring-pink-400 ring-opacity-80 scale-105 z-10" : "";

  return (
    <div 
      className={`${baseClass} ${sizeClass} ${colorClass} ${selectedClass}`}
      onClick={onClick}
    >
      {/* Rarity Stars */}
      <div className="absolute top-0.5 right-1 flex text-[0.5rem] text-yellow-500">
        {'★'.repeat(card.rarity)}
      </div>

      {/* Type Label */}
      <div className="absolute top-0.5 left-1 text-[0.4rem] uppercase opacity-60 tracking-tighter font-bold">
        {card.type.substring(0,3)}
      </div>

      {/* Main Text */}
      <div className="font-bold text-center px-1 break-words leading-tight w-full overflow-hidden flex-1 flex items-center justify-center pt-2">
        {card.text}
      </div>
      
      {/* Tag Indicators (Dots) */}
      <div className="absolute bottom-1 flex gap-0.5">
        {card.tags.slice(0, 3).map((t, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-current opacity-40" title={t}></div>
        ))}
      </div>
    </div>
  );
};

export const EmptySlot: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div 
      className="w-14 h-16 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 bg-opacity-50 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors flex-none"
      onClick={onClick}
    >
      <span className="text-xs">Drop</span>
    </div>
  );
};
