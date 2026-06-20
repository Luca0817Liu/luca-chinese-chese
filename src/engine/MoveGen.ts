import { Move } from './types';
import { State } from './State';
import { Rule } from './Rule';

export class MoveGen {
  /**
   * Generates all legal moves for the current active side in the state.
   * Leverages move ordering where captures/checks are placed first for optimal alpha-beta pruning.
   */
  public static gen_all_moves(state: State): Move[] {
    const list: Move[] = [];
    const side = state.side;

    for (let fy = 0; fy < 10; fy++) {
      for (let fx = 0; fx < 9; fx++) {
        const piece = state.board[fy][fx];
        if (piece !== 0 && Math.floor(piece / 10) === side) {
          // Found current side's piece. Generate potential moves.
          const movesForPiece = this.generatePseudoMoves(state.board, fx, fy, piece);
          for (const m of movesForPiece) {
            // Check if making this move would violate any rule (like putting own king in check, or king facing)
            const captured = state.make_move(fx, fy, m.to_x, m.to_y);
            
            const isRedFacing = Rule.isKingFacing(state.board, state.king_red_x, state.king_red_y, state.king_black_x, state.king_black_y);
            const isSelfChecked = state.is_check(side);

            state.unmake_move();

            if (!isRedFacing && !isSelfChecked) {
              list.push({
                from_x: fx,
                from_y: fy,
                to_x: m.to_x,
                to_y: m.to_y,
                capture: captured
              });
            }
          }
        }
      }
    }

    // Move Ordering: captures of highly valuable pieces first!
    list.sort((a, b) => {
      if (a.capture > 0 && b.capture === 0) return -1;
      if (a.capture === 0 && b.capture > 0) return 1;
      if (a.capture > 0 && b.capture > 0) {
        // Larger piece type gets captured first
        return (b.capture % 10) - (a.capture % 10);
      }
      return 0;
    });

    return list;
  }

  /**
   * Returns pseudo-legal moves for a specific piece on the board.
   */
  private static generatePseudoMoves(board: number[][], x: number, y: number, piece: number): { to_x: number; to_y: number }[] {
    const targets: { to_x: number; to_y: number }[] = [];
    const type = piece % 10;
    const side = Math.floor(piece / 10);

    // Depending on the piece type, we can either scan directions or check finite spots to limit Rule checks and gain speed
    switch (type) {
      case 1: // General (帅/将)
        const genDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of genDirs) {
          const tx = x + dx;
          const ty = y + dy;
          if (Rule.isValidMoveBasic(board, x, y, tx, ty)) targets.push({ to_x: tx, to_y: ty });
        }
        break;

      case 6: // Advisor (士)
        const advDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of advDirs) {
          const tx = x + dx;
          const ty = y + dy;
          if (Rule.isValidMoveBasic(board, x, y, tx, ty)) targets.push({ to_x: tx, to_y: ty });
        }
        break;

      case 5: // Elephant (相/象)
        const eleDirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
        for (const [dx, dy] of eleDirs) {
          const tx = x + dx;
          const ty = y + dy;
          if (Rule.isValidMoveBasic(board, x, y, tx, ty)) targets.push({ to_x: tx, to_y: ty });
        }
        break;

      case 3: // Horse (马)
        const horseOffsets = [
          [1, 2], [1, -2], [-1, 2], [-1, -2],
          [2, 1], [2, -1], [-2, 1], [-2, -1]
        ];
        for (const [dx, dy] of horseOffsets) {
          const tx = x + dx;
          const ty = y + dy;
          if (Rule.isValidMoveBasic(board, x, y, tx, ty)) targets.push({ to_x: tx, to_y: ty });
        }
        break;

      case 2: // Chariot (车)
      case 4: // Cannon (炮)
        // Scan full orthog rays
        const linearDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of linearDirs) {
          for (let step = 1; step <= 10; step++) {
            const tx = x + dx * step;
            const ty = y + dy * step;
            if (!Rule.inRange(tx, ty)) break;
            if (Rule.isValidMoveBasic(board, x, y, tx, ty)) {
              targets.push({ to_x: tx, to_y: ty });
            }
            // If there's a piece in our way, check beyond for cannon, and always stop stepping
            if (board[ty][tx] !== 0) {
              if (type === 4) { // Cannon capture scanner
                for (let nextStep = step + 1; nextStep <= 10; nextStep++) {
                  const cx = x + dx * nextStep;
                  const cy = y + dy * nextStep;
                  if (!Rule.inRange(cx, cy)) break;
                  if (board[cy][cx] !== 0) {
                    if (Rule.isValidMoveBasic(board, x, y, cx, cy)) {
                      targets.push({ to_x: cx, to_y: cy });
                    }
                    break; // Met second piece
                  }
                }
              }
              break; // Met first piece
            }
          }
        }
        break;

      case 7: // Soldier (兵/卒)
        const forward = side === 1 ? -1 : 1;
        // Forward relative to side
        const fy = y + forward;
        if (Rule.isValidMoveBasic(board, x, y, x, fy)) targets.push({ to_x: x, to_y: fy });
        // Sideways left and right
        const sideways = [-1, 1];
        for (const sx of sideways) {
          const tx = x + sx;
          if (Rule.isValidMoveBasic(board, x, y, tx, y)) targets.push({ to_x: tx, to_y: y });
        }
        break;
    }

    return targets;
  }
}
