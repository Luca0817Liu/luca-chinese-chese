import { BoardState, Piece, PieceType, PlayerColor, BOARD_ROWS, BOARD_COLS } from '../types';
import { getValidMoves, isGameOver } from './rules';

const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.GENERAL]: 10000,
  [PieceType.CHARIOT]: 1000,
  [PieceType.CANNON]: 450,
  [PieceType.HORSE]: 400,
  [PieceType.ADVISOR]: 200,
  [PieceType.ELEPHANT]: 200,
  [PieceType.SOLDIER]: 100,
};

// Simple positional bonuses (very basic)
function getPositionalValue(piece: Piece): number {
  const { r, c } = piece.position;
  let bonus = 0;

  if (piece.type === PieceType.SOLDIER) {
    // Soldiers are better when they cross the river
    const isRed = piece.color === 'red';
    const rowProgress = isRed ? (9 - r) : r;
    if (rowProgress >= 5) bonus += 50; // Over river
    if (rowProgress >= 7) bonus += 20; // Near palace
  }
  
  // Center is generally better for cannons and horses
  if (piece.type === PieceType.CANNON || piece.type === PieceType.HORSE) {
    if (c >= 3 && c <= 5) bonus += 20;
  }

  return bonus;
}

function evaluateBoard(board: BoardState, perspective: PlayerColor): number {
  let score = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type] + getPositionalValue(piece);
        score += (piece.color === perspective ? val : -val);
      }
    }
  }
  return score;
}

interface Move {
  from: { r: number; c: number };
  to: { r: number; c: number };
  score?: number;
}

export function findBestMove(board: BoardState, color: PlayerColor, depth: number = 3): Move | null {
  const moves = getAllPossibleMoves(board, color);
  if (moves.length === 0) return null;

  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const nextBoard = simulateMove(board, move);
    const score = minimax(nextBoard, depth - 1, false, -Infinity, Infinity, color);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getAllPossibleMoves(board: BoardState, color: PlayerColor): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const validEnds = getValidMoves(piece, board);
        validEnds.forEach(end => {
          moves.push({ from: { r, c }, to: end });
        });
      }
    }
  }
  return moves;
}

function simulateMove(board: BoardState, move: Move): BoardState {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.r][move.from.c];
  if (piece) {
    newBoard[move.to.r][move.to.c] = { ...piece, position: move.to };
    newBoard[move.from.r][move.from.c] = null;
  }
  return newBoard;
}

function minimax(
  board: BoardState, 
  depth: number, 
  isMaximizing: boolean, 
  alpha: number, 
  beta: number, 
  perspective: PlayerColor
): number {
  const result = isGameOver(board);
  if (result === perspective) return 100000;
  if (result && result !== 'draw') return -100000;
  if (result === 'draw') return 0;
  if (depth === 0) return evaluateBoard(board, perspective);

  const opponent = perspective === 'red' ? 'black' : 'red';

  if (isMaximizing) {
    let maxEval = -Infinity;
    const moves = getAllPossibleMoves(board, perspective);
    for (const move of moves) {
      const ev = minimax(simulateMove(board, move), depth - 1, false, alpha, beta, perspective);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const moves = getAllPossibleMoves(board, opponent);
    for (const move of moves) {
      const ev = minimax(simulateMove(board, move), depth - 1, true, alpha, beta, perspective);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
