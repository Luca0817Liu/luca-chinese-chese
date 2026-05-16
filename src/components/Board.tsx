
import React from 'react';
import { BoardState, BOARD_ROWS, BOARD_COLS, Piece as PieceType } from '../types';
import { Piece } from './Piece';

interface BoardProps {
  board: BoardState;
  selectedPiece: PieceType | null;
  validMoves: { r: number; c: number }[];
  onSquareClick: (r: number, c: number) => void;
  lang: 'zh' | 'en';
}

export const Board: React.FC<BoardProps> = ({ board, selectedPiece, validMoves, onSquareClick, lang }) => {
  const isMovePossible = (r: number, c: number) => {
    return validMoves.some(m => m.r === r && m.c === c);
  };

  return (
    <div 
      className="relative aspect-[9/10] w-full max-w-[600px] mx-auto bg-[#e6c07d] p-[2%] rounded-lg shadow-2xl border-8 border-[#5d4037] overflow-hidden"
      style={{
        backgroundImage: `url('https://www.transparenttextures.com/patterns/wood-pattern.png')`,
      }}
    >
      {/* Grid Lines */}
      <div className="absolute inset-[4%] border-2 border-stone-800">
        {/* Horizontal lines */}
        {[...Array(BOARD_ROWS)].map((_, i) => (
          <div 
            key={`h-${i}`} 
            className="absolute left-0 right-0 h-[1px] bg-stone-800" 
            style={{ top: `${(i / (BOARD_ROWS - 1)) * 100}%` }}
          />
        ))}
        {/* Vertical lines */}
        {[...Array(BOARD_COLS)].map((_, i) => (
          <div 
            key={`v-${i}`} 
            className="absolute top-0 bottom-0 w-[1px] bg-stone-800" 
            style={{ 
              left: `${(i / (BOARD_COLS - 1)) * 100}%`,
              height: i === 0 || i === BOARD_COLS - 1 ? '100%' : '100%' // Full lines
            }}
          >
            {/* Break for river in middle vertical lines */}
            {i > 0 && i < BOARD_COLS - 1 && (
              <div className="absolute top-[44.4%] h-[11.1%] w-full bg-[#e6c07d]" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/wood-pattern.png')` }} />
            )}
          </div>
        ))}

        {/* River Label */}
        <div className="absolute top-[44.4%] left-0 right-0 h-[11.1%] flex items-center justify-around pointer-events-none">
          <span className="text-2xl font-bold text-stone-800 opacity-60 transform rotate-180 md:rotate-0">
            {lang === 'zh' ? '楚河' : 'CHU RIVER'}
          </span>
          <span className="text-2xl font-bold text-stone-800 opacity-60">
            {lang === 'zh' ? '漢界' : 'HAN BORDER'}
          </span>
        </div>

        {/* Palaces (X markers) */}
        {/* Black side palace */}
        <svg className="absolute top-0 left-[37.5%] w-[25%] h-[22.2%] pointer-events-none" viewBox="0 0 100 100">
          <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" className="text-stone-800" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" className="text-stone-800" />
        </svg>
        {/* Red side palace */}
        <svg className="absolute bottom-0 left-[37.5%] w-[25%] h-[22.2%] pointer-events-none" viewBox="0 0 100 100">
          <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" className="text-stone-800" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" className="text-stone-800" />
        </svg>
      </div>

      {/* Squares & Pieces */}
      <div className="absolute inset-[4%] grid grid-rows-10 grid-cols-9">
        {[...Array(BOARD_ROWS)].map((_, r) => 
          [...Array(BOARD_COLS)].map((_, c) => {
            const piece = board[r][c];
            const isPossible = isMovePossible(r, c);
            const isSelected = selectedPiece?.position.r === r && selectedPiece?.position.c === c;

            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => onSquareClick(r, c)}
                className="relative flex items-center justify-center cursor-pointer"
              >
                {/* Square coordinate for debugging if needed */}
                {/* <span className="absolute bottom-0 right-0 text-[8px] opacity-20">{r},{c}</span> */}
                
                {/* Move Hint */}
                {isPossible && (
                  <div className={`
                    w-4 h-4 rounded-full bg-white/60 ring-2 ring-blue-400 z-10
                    ${piece ? 'opacity-80 scale-150' : 'opacity-60'}
                  `} />
                )}

                {/* Piece */}
                {piece && (
                  <Piece 
                    piece={piece} 
                    isSelected={isSelected} 
                    lang={lang}
                    onClick={() => onSquareClick(r, c)} 
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
