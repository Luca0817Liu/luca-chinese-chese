
export type PlayerColor = 'red' | 'black';

export enum PieceType {
  GENERAL = 'general', // 帅/将
  ADVISOR = 'advisor', // 士
  ELEPHANT = 'elephant', // 象/相
  HORSE = 'horse', // 马
  CHARIOT = 'chariot', // 车
  CANNON = 'cannon', // 炮
  SOLDIER = 'soldier', // 兵/卒
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  position: { r: number; c: number };
}

export type BoardState = (Piece | null)[][];

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

export enum GameMode {
  PVP = 'pvp',
  PVE = 'pve',
}

export interface GameState {
  board: BoardState;
  turn: PlayerColor;
  selectedPiece: Piece | null;
  validMoves: { r: number; c: number }[];
  history: BoardState[];
  winner: PlayerColor | 'draw' | null;
  lang: 'zh' | 'en';
  mode: GameMode;
}

export const INITIAL_PIECES: Partial<Piece>[] = [
  // Red
  { type: PieceType.CHARIOT, color: 'red', position: { r: 9, c: 0 } },
  { type: PieceType.HORSE, color: 'red', position: { r: 9, c: 1 } },
  { type: PieceType.ELEPHANT, color: 'red', position: { r: 9, c: 2 } },
  { type: PieceType.ADVISOR, color: 'red', position: { r: 9, c: 3 } },
  { type: PieceType.GENERAL, color: 'red', position: { r: 9, c: 4 } },
  { type: PieceType.ADVISOR, color: 'red', position: { r: 9, c: 5 } },
  { type: PieceType.ELEPHANT, color: 'red', position: { r: 9, c: 6 } },
  { type: PieceType.HORSE, color: 'red', position: { r: 9, c: 7 } },
  { type: PieceType.CHARIOT, color: 'red', position: { r: 9, c: 8 } },
  { type: PieceType.CANNON, color: 'red', position: { r: 7, c: 1 } },
  { type: PieceType.CANNON, color: 'red', position: { r: 7, c: 7 } },
  { type: PieceType.SOLDIER, color: 'red', position: { r: 6, c: 0 } },
  { type: PieceType.SOLDIER, color: 'red', position: { r: 6, c: 2 } },
  { type: PieceType.SOLDIER, color: 'red', position: { r: 6, c: 4 } },
  { type: PieceType.SOLDIER, color: 'red', position: { r: 6, c: 6 } },
  { type: PieceType.SOLDIER, color: 'red', position: { r: 6, c: 8 } },

  // Black
  { type: PieceType.CHARIOT, color: 'black', position: { r: 0, c: 0 } },
  { type: PieceType.HORSE, color: 'black', position: { r: 0, c: 1 } },
  { type: PieceType.ELEPHANT, color: 'black', position: { r: 0, c: 2 } },
  { type: PieceType.ADVISOR, color: 'black', position: { r: 0, c: 3 } },
  { type: PieceType.GENERAL, color: 'black', position: { r: 0, c: 4 } },
  { type: PieceType.ADVISOR, color: 'black', position: { r: 0, c: 5 } },
  { type: PieceType.ELEPHANT, color: 'black', position: { r: 0, c: 6 } },
  { type: PieceType.HORSE, color: 'black', position: { r: 0, c: 7 } },
  { type: PieceType.CHARIOT, color: 'black', position: { r: 0, c: 8 } },
  { type: PieceType.CANNON, color: 'black', position: { r: 2, c: 1 } },
  { type: PieceType.CANNON, color: 'black', position: { r: 2, c: 7 } },
  { type: PieceType.SOLDIER, color: 'black', position: { r: 3, c: 0 } },
  { type: PieceType.SOLDIER, color: 'black', position: { r: 3, c: 2 } },
  { type: PieceType.SOLDIER, color: 'black', position: { r: 3, c: 4 } },
  { type: PieceType.SOLDIER, color: 'black', position: { r: 3, c: 6 } },
  { type: PieceType.SOLDIER, color: 'black', position: { r: 3, c: 8 } },
];
