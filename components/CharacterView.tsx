
import React, { useState, useEffect } from 'react';
import { CharacterData } from '../types';
import { Loader2 } from 'lucide-react';

interface CharacterViewProps {
  character: CharacterData;
  reaction: string; 
  imageUrl?: string | null;
  isVisible?: boolean; // New prop for transition
}

export const CharacterView: React.FC<CharacterViewProps> = ({ character, reaction, imageUrl, isVisible = true }) => {
  
  // CSS Animation for "Live2D" breathing effect
  const breathingStyle: React.CSSProperties = {
    animation: 'breathe 4s ease-in-out infinite',
    transformOrigin: 'bottom center',
  };

  const getFilterAndTransform = () => {
    let filter = 'brightness(1.05)';
    let transform = '';
    
    switch (reaction) {
      case 'angry': 
        filter += ' grayscale(0.2) contrast(1.2) brightness(0.9)'; 
        break;
      case 'annoyed':
        filter += ' contrast(1.1) sepia(0.2)';
        break;
      case 'blush': 
        filter += ' saturate(1.3) brightness(1.05) drop-shadow(0 0 15px rgba(255, 105, 180, 0.4))'; 
        break;
      case 'happy': 
        filter += ' brightness(1.1) saturate(1.1)'; 
        transform += ' scale(1.02)';
        break;
      case 'sad':
        filter += ' brightness(0.9) grayscale(0.3) hue-rotate(-10deg)';
        transform += ' translateY(10px) rotate(-2deg)';
        break;
      case 'bored':
        filter += ' opacity(0.9) grayscale(0.5)';
        transform += ' translateY(5px)';
        break;
      case 'lookaway':
        transform += ' rotateY(15deg) translateX(10px)';
        break;
      default: 
        break;
    }
    return { filter, transform };
  };

  const { filter, transform } = getFilterAndTransform();

  return (
    <div className={`relative w-full h-full flex justify-center items-end pointer-events-none overflow-visible transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        @keyframes breathe {
          0% { transform: scaleY(1.00) translateY(0px); }
          50% { transform: scaleY(1.01) translateY(-2px); }
          100% { transform: scaleY(1.00) translateY(0px); }
        }
      `}</style>

      <div 
        className="relative transition-all duration-700 ease-out flex items-end justify-center"
        style={{
            height: '100%', 
            width: '100%',
            ...breathingStyle
        }}
      >
         {imageUrl ? (
           <img 
             src={imageUrl} 
             alt="Character" 
             className="h-[95%] w-auto max-w-none object-contain drop-shadow-2xl transition-all duration-700"
             style={{ 
               filter,
               transform: `${breathingStyle.transform} ${transform}` // Merge breathe with reaction transform
             }}
           />
         ) : (
           <div className="w-full h-full flex flex-col items-center justify-center opacity-70 animate-pulse">
               <Loader2 className="animate-spin text-white mb-2" size={48} />
               <div className="text-white font-bold text-shadow">Summoning {character.name}...</div>
           </div>
         )}
      </div>
    </div>
  );
};
