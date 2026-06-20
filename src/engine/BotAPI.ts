import { Move } from './types';
import { State } from './State';
import { Search } from './Search';
import { Piece as WebPiece, BoardState as WebBoardState, PlayerColor, PieceType } from '../types';

export class BotAPI {
  /**
   * Helper mapping from our web piece type to the engine's piece code
   */
  private static webToEnginePiece(type: PieceType, color: PlayerColor): number {
    const sidePrefix = color === 'red' ? 10 : 20;
    let pieceSuffix = 0;
    switch (type) {
      case PieceType.GENERAL: pieceSuffix = 1; break;
      case PieceType.CHARIOT: pieceSuffix = 2; break;
      case PieceType.HORSE:   pieceSuffix = 3; break;
      case PieceType.CANNON:  pieceSuffix = 4; break;
      case PieceType.ELEPHANT:pieceSuffix = 5; break;
      case PieceType.ADVISOR: pieceSuffix = 6; break;
      case PieceType.SOLDIER: pieceSuffix = 7; break;
    }
    return sidePrefix + pieceSuffix;
  }

  /**
   * Converts a Web chess board state (Piece | null)[][] to a 10x9 number[][] matrix.
   */
  public static convertWebBoardToMatrix(webBoard: WebBoardState): number[][] {
    const matrix = Array(10).fill(0).map(() => Array(9).fill(0));
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const item = webBoard[r][c];
        if (item) {
          matrix[r][c] = this.webToEnginePiece(item.type, item.color);
        }
      }
    }
    return matrix;
  }

  /**
   * Main unified entry point for getting the AI's next move.
   * Completely offline, synchronous, and optimized.
   *
   * @param webBoard Current board state from Web application
   * @param currentTurn Current active player side ('red' | 'black')
   * @param depth Search depth (2 = Easy, 4 = Normal, 6 = Hard)
   * @returns Best legal move or null if no moves are possible
   */
  public static get_ai_move(
    webBoard: WebBoardState,
    currentTurn: PlayerColor,
    depth: number = 4
  ): { from: { r: number; c: number }; to: { r: number; c: number } } | null {
    // 1. Clear transposition table to start search fresh
    Search.clearCache();

    // 2. Convert raw UI board to engine State matrix
    const matrix = this.convertWebBoardToMatrix(webBoard);
    const sideCode = currentTurn === 'red' ? 1 : 2;
    const state = new State(matrix, sideCode);

    // 3. Search for best move under minimax + alpha-beta guidelines
    const result = Search.search_best_move(state, depth);

    if (result.move) {
      return {
        from: { r: result.move.from_y, c: result.move.from_x },
        to: { r: result.move.to_y, c: result.move.to_x }
      };
    }
    return null;
  }
}
