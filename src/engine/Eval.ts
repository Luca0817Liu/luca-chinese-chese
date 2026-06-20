import { State } from './State';

export class Eval {
  // Base values of pieces
  private static BASE_VALUES: Record<number, number> = {
    1: 99999, // General (帅/将)
    2: 900,   // Chariot (车)
    3: 400,   // Horse (马)
    4: 450,   // Cannon (炮)
    5: 120,   // Elephant (相/象) (slightly higher than 100 for safety)
    6: 120,   // Advisor (士)
    7: 100,   // Soldier (兵/卒)
  };

  // Positional weight tables (oriented for Red, we mirror the index for Black)
  // Higher value is better. Size is 10 rows (y) by 9 columns (x)

  // Chariot (车) - Likes open files and central control, high activity
  private static CAR_PST = [
    [90, 100, 100, 110, 100, 110, 100, 100, 90],
    [90, 110, 100, 120, 110, 120, 100, 110, 90],
    [90, 100,  95, 110, 100, 110,  95, 100, 90],
    [90, 105, 100, 115, 110, 115, 100, 105, 90],
    [90, 100,  95, 110, 105, 110,  95, 100, 90],
    [90, 100,  95, 110, 105, 110,  95, 100, 90],
    [85,  95,  90, 105, 100, 105,  90,  95, 85],
    [80,  90,  85, 100,  95, 100,  85,  90, 80],
    [75,  85,  80,  95,  90,  95,  80,  85, 75],
    [80,  90,  85,  90,  95,  90,  85,  90, 80]
  ];

  // Horse (马) - Strong in center, hates borders & corners (trapped easily)
  private static HORSE_PST = [
    [10,  20,  15,  15,  10,  15,  15,  20,  10],
    [15,  30,  25,  35,  20,  35,  25,  30,  15],
    [20,  35,  40,  45,  35,  45,  40,  35,  20],
    [20,  40,  45,  55,  50,  55,  45,  40,  20],
    [15,  35,  40,  50,  55,  50,  40,  35,  15],
    [15,  30,  35,  45,  50,  45,  35,  30,  15],
    [10,  25,  30,  35,  40,  35,  30,  25,  10],
    [10,  15,  20,  25,  20,  25,  20,  15,  10],
    [ 5,  10,  15,  15,  10,  15,  15,  10,   5],
    [ 0,   5,  10,  10,  10,  10,  10,   5,   0]
  ];

  // Cannon (炮) - Needs mounts, loves back row and 2-row positioning
  private static CAN_PST = [
    [20,  30,  25,  15,  10,  15,  25,  30,  20],
    [15,  25,  20,  15,  10,  15,  20,  25,  15],
    [10,  20,  15,  10,   5,  10,  15,  20,  10],
    [ 5,  15,  10,  10,  10,  10,  10,  15,   5],
    [ 0,  10,   5,   5,  10,   5,   5,  10,   0],
    [-5,   5,   0,   0,   5,   0,   0,   5,  -5],
    [-5,   0,  -5,   0,   0,   0,  -5,   0,  -5],
    [-5,   0,  -5,   5,   5,   5,  -5,   0,  -5],
    [-5,  -5,  -5,   0,   0,   0,  -5,  -5,  -5],
    [-5,  -5,  -5,   0,   5,   0,  -5,  -5,  -5]
  ];

  // Soldier/Pawns (兵/卒) - Value jumps significantly after crossing the river (above row 5 for red)
  private static SOL_PST = [
    [60,  80,  90, 100, 100, 100,  90,  80,  60],
    [50,  70,  85,  95,  95,  95,  85,  70,  50],
    [40,  60,  75,  85,  90,  85,  75,  60,  40],
    [30,  55,  65,  75,  80,  75,  65,  55,  30],
    [20,  40,  50,  60,  70,  60,  50,  40,  20],
    [10,  25,  35,  40,  45,  40,  35,  25,  10],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0]
  ];

  // Palace weights for General (帅/将), Advisor (士), Elephant (相/象)
  private static DEF_PST = [
    [ 0,   0,   0,   5,  10,   5,   0,   0,   0],
    [ 0,   0,   0,   0,   5,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   0,   0,   0,   0,   0],
    [ 0,   0,   0,   0,   5,   0,   0,   0,   0],
    [ 0,   0,   0,   5,  15,   5,   0,   0,   0]
  ];

  /**
   * Main evaluation function.
   * Returns a material and positional score from current state's perspective.
   * Red pieces yield positive credits, Black pieces yield negative credits.
   */
  public static evaluate(state: State): number {
    let score = 0;

    // Check if any king is missing (early return with infinity)
    let redKingAlive = false;
    let blackKingAlive = false;

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = state.board[y][x];
        if (piece === 0) continue;

        const side = Math.floor(piece / 10);
        const type = piece % 10;
        const sign = side === 1 ? 1 : -1;

        if (type === 1) {
          if (side === 1) redKingAlive = true;
          else blackKingAlive = true;
        }

        // 1. Material score
        let value = this.BASE_VALUES[type] || 0;

        // 2. Positional values (Piece-Square Tables)
        // For black side, we mirror the y-coordinate table vertically to align perspective
        const lookupY = (side === 1) ? y : (9 - y);
        const lookupX = x;

        let posBonus = 0;
        if (type === 2) {
          posBonus = this.CAR_PST[lookupY][lookupX];
        } else if (type === 3) {
          posBonus = this.HORSE_PST[lookupY][lookupX];
        } else if (type === 4) {
          posBonus = this.CAN_PST[lookupY][lookupX];
        } else if (type === 7) {
          posBonus = this.SOL_PST[lookupY][lookupX];
        } else {
          posBonus = this.DEF_PST[lookupY][lookupX];
        }

        score += sign * (value + posBonus);
      }
    }

    if (!redKingAlive) return -999999;
    if (!blackKingAlive) return 999999;

    // 3. Dynamic adjustment (bonus for active state/check/vunerability)
    if (state.is_check(1)) {
      score -= 280; // Red is checked, deduction
    }
    if (state.is_check(2)) {
      score += 280; // Black is checked, bonus
    }

    return score;
  }
}
