
import React, { useState, useCallback, useEffect } from 'react';
import { 
  BOARD_ROWS, 
  BOARD_COLS, 
  INITIAL_PIECES, 
  Piece, 
  PlayerColor, 
  BoardState,
  PieceType,
  GameMode
} from './types';
import { Board } from './components/Board';
import { getValidMoves, isGameOver } from './utils/rules';
import { findBestMove } from './utils/ai';
import { RotateCcw, Undo, Flag, Languages, Info, Users, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const createEmptyBoard = (): BoardState => 
  Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

const populateBoard = (pieces: Partial<Piece>[]): BoardState => {
  const board = createEmptyBoard();
  pieces.forEach((p, idx) => {
    if (p.position && p.type && p.color) {
      board[p.position.r][p.position.c] = {
        ...p,
        id: `${p.color}-${p.type}-${idx}`,
      } as Piece;
    }
  });
  return board;
};

const t = {
  zh: {
    title: '在线中国象棋',
    redTurn: '红方行走',
    blackTurn: '黑方行走',
    winner: (color: string) => `${color === 'red' ? '红方' : '黑方'} 获得胜利！`,
    draw: '和棋',
    reset: '重新开始',
    undo: '悔棋',
    resign: '认输',
    lang: 'English',
    turnIndicator: '当前回合',
    pvp: '双人对战',
    pve: '人机对局',
    aiThinking: 'AI正在思考...',
  },
  en: {
    title: 'Chinese Chess Online',
    redTurn: "Red's Turn",
    blackTurn: "Black's Turn",
    winner: (color: string) => `${color.charAt(0).toUpperCase() + color.slice(1)} Wins!`,
    draw: 'Draw Game',
    reset: 'Reset',
    undo: 'Undo',
    resign: 'Resign',
    lang: '中文',
    turnIndicator: 'Turn',
    pvp: 'PvP Mode',
    pve: 'AI Mode',
    aiThinking: 'AI is thinking...',
  }
};

export default function App() {
  const [board, setBoard] = useState<BoardState>(populateBoard(INITIAL_PIECES));
  const [turn, setTurn] = useState<PlayerColor>('red');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [history, setHistory] = useState<BoardState[]>([]);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [mode, setMode] = useState<GameMode>(GameMode.PVP);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const curT = t[lang];

  const resetGame = () => {
    setBoard(populateBoard(INITIAL_PIECES));
    setTurn('red');
    setSelectedPiece(null);
    setValidMoves([]);
    setHistory([]);
    setWinner(null);
    setIsAiThinking(false);
  };

  const undoMove = () => {
    if (history.length === 0 || winner || isAiThinking) return;
    
    // In PvE, undo should revert both AI and player moves
    if (mode === GameMode.PVE && history.length >= 2) {
      const prevBoard = history[history.length - 2];
      setBoard(prevBoard);
      setHistory(history.slice(0, -2));
      setTurn('red');
    } else {
      const prevBoard = history[history.length - 1];
      setBoard(prevBoard);
      setHistory(history.slice(0, -1));
      setTurn(turn === 'red' ? 'black' : 'red');
    }
    
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const executeMove = useCallback((r: number, c: number, pieceToMove: Piece, currentBoard: BoardState) => {
    const newBoard = currentBoard.map(row => [...row]);
    const oldPos = pieceToMove.position;

    // Execute move
    newBoard[r][c] = { ...pieceToMove, position: { r, c } };
    newBoard[oldPos.r][oldPos.c] = null;

    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);
    
    const nextTurn = pieceToMove.color === 'red' ? 'black' : 'red';
    setTurn(nextTurn);

    // Check winner
    const gameResult = isGameOver(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    }
    return { newBoard, nextTurn };
  }, []);

  // AI Logic Effect
  useEffect(() => {
    if (mode === GameMode.PVE && turn === 'black' && !winner && !isAiThinking) {
      setIsAiThinking(true);
      // Add a small delay for "thinking" feel
      const timer = setTimeout(() => {
        const bestMove = findBestMove(board, 'black', 3);
        if (bestMove) {
          const piece = board[bestMove.from.r][bestMove.from.c];
          if (piece) {
            setHistory(prev => [...prev, board]);
            executeMove(bestMove.to.r, bestMove.to.c, piece, board);
          }
        } else {
          // If no moves, black loses or draw
          setWinner('red');
        }
        setIsAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mode, turn, winner, board, executeMove, isAiThinking]);

  const onSquareClick = useCallback((r: number, c: number) => {
    if (winner || isAiThinking) return;

    const clickedPiece = board[r][c];

    // If a piece belongs to current player is clicked
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPiece(clickedPiece);
      setValidMoves(getValidMoves(clickedPiece, board));
      return;
    }

    // If a destination square is clicked
    if (selectedPiece) {
      const isLegal = validMoves.some(m => m.r === r && m.c === c);
      if (isLegal) {
        setHistory(prev => [...prev, board]);
        executeMove(r, c, selectedPiece, board);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  }, [board, turn, selectedPiece, validMoves, winner, isAiThinking, executeMove]);

  return (
    <div className="min-h-screen bg-[#2c1b18] text-white flex flex-col items-center p-4">
      {/* Header Info */}
      <div className="w-full max-w-[600px] flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif mb-1">{curT.title}</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${turn === 'red' ? 'bg-red-500 animate-pulse' : 'bg-stone-500'}`} />
            <span className={`text-sm font-medium ${turn === 'red' ? 'text-red-400' : 'text-stone-400'}`}>
              {turn === 'red' ? curT.redTurn : curT.blackTurn}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex bg-stone-800 p-1 rounded-lg">
            <button
              onClick={() => { setMode(GameMode.PVP); resetGame(); }}
              className={`p-2 rounded-md transition-all flex items-center gap-1 ${mode === GameMode.PVP ? 'bg-stone-600 shadow-inner' : 'hover:bg-stone-700'}`}
              title={curT.pvp}
            >
              <Users size={16} />
              <span className="hidden sm:inline text-xs">{curT.pvp}</span>
            </button>
            <button
              onClick={() => { setMode(GameMode.PVE); resetGame(); }}
              className={`p-2 rounded-md transition-all flex items-center gap-1 ${mode === GameMode.PVE ? 'bg-stone-600 shadow-inner' : 'hover:bg-stone-700'}`}
              title={curT.pve}
            >
              <Bot size={16} />
              <span className="hidden sm:inline text-xs">{curT.pve}</span>
            </button>
          </div>

          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="p-2 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Languages size={18} />
            <span className="text-xs">{curT.lang}</span>
          </button>
        </div>
      </div>

      {/* Thinking Indicator */}
      <AnimatePresence>
        {isAiThinking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 px-4 py-2 bg-stone-800/80 backdrop-blur rounded-full border border-stone-700 flex items-center gap-2 text-stone-300 text-xs"
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" />
            </div>
            {curT.aiThinking}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Board */}
      <div className="relative w-full max-w-[600px] mb-8">
        <Board 
          board={board} 
          selectedPiece={selectedPiece} 
          validMoves={validMoves} 
          onSquareClick={onSquareClick}
          lang={lang}
        />

        {/* Win/Overlay */}
        <AnimatePresence>
          {winner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 border-2 border-yellow-500/50 shadow-2xl text-center max-w-[300px] w-full">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-yellow-500 mb-6 font-serif">
                  {winner === 'draw' ? curT.draw : curT.winner(winner)}
                </h2>
                <button 
                  onClick={resetGame}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg"
                >
                  {curT.reset}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Container */}
      <div className="w-full max-w-[600px] grid grid-cols-3 gap-3">
        <button 
          onClick={undoMove}
          disabled={history.length === 0 || !!winner}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
        >
          <Undo size={24} />
          <span className="text-xs font-medium">{curT.undo}</span>
        </button>
        
        <button 
          onClick={resetGame}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-stone-800 hover:bg-red-900/40 rounded-xl transition-all border border-transparent hover:border-red-900/50"
        >
          <RotateCcw size={24} />
          <span className="text-xs font-medium">{curT.reset}</span>
        </button>

        <button 
          onClick={() => setWinner(turn === 'red' ? 'black' : 'red')}
          disabled={!!winner}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-stone-800 hover:bg-orange-900/40 rounded-xl transition-all disabled:opacity-30"
        >
          <Flag size={24} />
          <span className="text-xs font-medium">{curT.resign}</span>
        </button>
      </div>

      {/* Footer Instructions (Brief) */}
      <div className="mt-auto pt-8 text-stone-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
        <Info size={12} />
        Traditional Chinese Chess • Rules Validated
      </div>
    </div>
  );
}
