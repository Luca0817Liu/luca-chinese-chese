import { Move } from './types';
import { State } from './State';
import { MoveGen } from './MoveGen';
import { Eval } from './Eval';

export class Search {
  private static transpositionTable: Map<string, { depth: number; score: number; bestMove: Move | null }> = new Map();

  /**
   * Clears any cached boards in Transposition Table.
   */
  public static clearCache() {
    this.transpositionTable.clear();
  }

  /**
   * Returns a unique string hash of the current board layout to save calculations.
   */
  private static getBoardHash(state: State): string {
    let hash = `${state.side}`;
    for (let y = 0; y < 10; y++) {
      hash += `|${state.board[y].join(',')}`;
    }
    return hash;
  }

  /**
   * Top-level entry function to search for the best move.
   * Returns both the best move and its associated evaluation score.
   */
  public static search_best_move(state: State, depth: number): { move: Move | null; score: number } {
    const isMax = state.side === 1; // Red wants to Maximize, Black wants to Minimize
    const moves = MoveGen.gen_all_moves(state);

    if (moves.length === 0) {
      // No legal moves available (Checkmate or Stalemate)
      return { move: null, score: isMax ? -999999 : 999999 };
    }

    let bestMove: Move | null = null;
    let alpha = -Infinity;
    let beta = Infinity;

    if (isMax) {
      let bestScore = -Infinity;
      for (const m of moves) {
        state.make_move(m.from_x, m.from_y, m.to_x, m.to_y);
        const score = this.minimax_ab(state, depth - 1, false, alpha, beta);
        state.unmake_move();

        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
        alpha = Math.max(alpha, score);
      }
      return { move: bestMove, score: bestScore };
    } else {
      let bestScore = Infinity;
      for (const m of moves) {
        state.make_move(m.from_x, m.from_y, m.to_x, m.to_y);
        const score = this.minimax_ab(state, depth - 1, true, alpha, beta);
        state.unmake_move();

        if (score < bestScore) {
          bestScore = score;
          bestMove = m;
        }
        beta = Math.min(beta, score);
      }
      return { move: bestMove, score: bestScore };
    }
  }

  /**
   * Minimax algorithm with Alpha-Beta pruning recursion.
   */
  private static minimax_ab(
    state: State,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number {
    const hash = this.getBoardHash(state);
    const cached = this.transpositionTable.get(hash);
    if (cached && cached.depth >= depth) {
      return cached.score;
    }

    // Leaf node or terminal node
    if (depth === 0) {
      const evaluation = Eval.evaluate(state);
      this.transpositionTable.set(hash, { depth, score: evaluation, bestMove: null });
      return evaluation;
    }

    const moves = MoveGen.gen_all_moves(state);
    if (moves.length === 0) {
      // Checkmate or Stalemate
      const score = state.is_check(state.side) 
        ? (isMaximizing ? -999999 + (10 - depth) : 999999 - (10 - depth)) // Prefer shorter checkmates
        : 0; // Stalemate is a Draw
      return score;
    }

    let bestLocalMove: Move | null = null;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const m of moves) {
        state.make_move(m.from_x, m.from_y, m.to_x, m.to_y);
        const score = this.minimax_ab(state, depth - 1, false, alpha, beta);
        state.unmake_move();

        if (score > maxScore) {
          maxScore = score;
          bestLocalMove = m;
        }
        alpha = Math.max(alpha, maxScore);
        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }
      this.transpositionTable.set(hash, { depth, score: maxScore, bestMove: bestLocalMove });
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const m of moves) {
        state.make_move(m.from_x, m.from_y, m.to_x, m.to_y);
        const score = this.minimax_ab(state, depth - 1, true, alpha, beta);
        state.unmake_move();

        if (score < minScore) {
          minScore = score;
          bestLocalMove = m;
        }
        beta = Math.min(beta, minScore);
        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }
      this.transpositionTable.set(hash, { depth, score: minScore, bestMove: bestLocalMove });
      return minScore;
    }
  }
}
