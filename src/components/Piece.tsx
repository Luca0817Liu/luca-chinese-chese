
import React from 'react';
import { motion } from 'motion/react';
import { Piece as PieceType, PieceType as PType } from '../types';

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  onClick: () => void;
  lang: 'zh' | 'en';
}

const pieceNames: Record<string, Record<string, string>> = {
  red: {
    [PType.GENERAL]: '帅',
    [PType.ADVISOR]: '仕',
    [PType.ELEPHANT]: '相',
    [PType.HORSE]: '马',
    [PType.CHARIOT]: '车',
    [PType.CANNON]: '炮',
    [PType.SOLDIER]: '兵',
  },
  black: {
    [PType.GENERAL]: '将',
    [PType.ADVISOR]: '士',
    [PType.ELEPHANT]: '象',
    [PType.HORSE]: '馬',
    [PType.CHARIOT]: '車',
    [PType.CANNON]: '砲',
    [PType.SOLDIER]: '卒',
  }
};

const pieceNamesEn: Record<string, string> = {
  [PType.GENERAL]: 'K',
  [PType.ADVISOR]: 'A',
  [PType.ELEPHANT]: 'E',
  [PType.HORSE]: 'H',
  [PType.CHARIOT]: 'C',
  [PType.CANNON]: 'P',
  [PType.SOLDIER]: 'S',
};

export const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick, lang }) => {
  const isRed = piece.color === 'red';
  const name = lang === 'zh' ? pieceNames[piece.color][piece.type] : pieceNamesEn[piece.type];

  return (
    <motion.div
      layoutId={piece.id}
      initial={false}
      animate={{ scale: isSelected ? 1.15 : 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        relative w-[90%] h-[90%] rounded-full cursor-pointer
        flex items-center justify-center
        transition-shadow duration-200
        ${isRed ? 'bg-orange-50' : 'bg-stone-100'}
        ${isSelected ? 'ring-4 ring-yellow-400 shadow-2xl z-20' : 'shadow-lg border-2 border-stone-400'}
      `}
      style={{
        boxShadow: isSelected 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), inset 0 2px 4px 0 rgba(255, 255, 255, 0.5)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)'
      }}
    >
      <div className={`
        w-[88%] h-[88%] rounded-full border-2 
        ${isRed ? 'border-red-300' : 'border-stone-400'}
        flex items-center justify-center
      `}>
        <span className={`
          text-3xl font-bold select-none
          ${isRed ? 'text-red-700' : 'text-stone-900'}
          ${lang === 'zh' ? 'font-serif' : 'font-mono'}
        `}>
          {name}
        </span>
      </div>
      
      {/* Embossed effect layers */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-bl from-white/20 to-transparent pointer-events-none" />
    </motion.div>
  );
};
