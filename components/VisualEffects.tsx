import React from 'react';
import { Heart, Snowflake } from 'lucide-react';

interface VisualEffectsProps {
  type: 'none' | 'positive' | 'negative';
}

export const VisualEffects: React.FC<VisualEffectsProps> = ({ type }) => {
  if (type === 'none') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {type === 'positive' && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up opacity-0"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`
              }}
            >
              <Heart className="fill-pink-500 text-pink-500 drop-shadow-lg" size={30 + Math.random() * 20} />
            </div>
          ))}
        </>
      )}

      {type === 'negative' && (
        <div className="absolute inset-0 bg-blue-200/30 animate-freeze flex items-center justify-center">
            <Snowflake className="text-blue-500 animate-spin opacity-50 absolute top-1/4 left-1/4" size={60} />
            <Snowflake className="text-blue-500 animate-spin opacity-50 absolute bottom-1/3 right-1/4" size={80} />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-300/40 to-transparent mix-blend-overlay"></div>
        </div>
      )}
    </div>
  );
};
