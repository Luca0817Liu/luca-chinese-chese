export class Rule {
  public static inRange(x: number, y: number): boolean {
    return x >= 0 && x <= 8 && y >= 0 && y <= 9;
  }

  public static isValidMoveBasic(
    board: number[][],
    from_x: number,
    from_y: number,
    to_x: number,
    to_y: number
  ): boolean {
    if (!this.inRange(from_x, from_y) || !this.inRange(to_x, to_y)) return false;
    if (from_x === to_x && from_y === to_y) return false;

    const piece = board[from_y][from_x];
    if (piece === 0) return false;

    const target = board[to_y][to_x];
    const sourceSide = Math.floor(piece / 10);
    const targetSide = Math.floor(target / 10);

    // Cannot capture own piece
    if (target !== 0 && sourceSide === targetSide) return false;

    const type = piece % 10;
    const dx = Math.abs(to_x - from_x);
    const dy = Math.abs(to_y - from_y);

    switch (type) {
      case 1: // 帅 / 将 (General)
        // Must stay in palace: Red [3..5][7..9], Black [3..5][0..2]
        if (sourceSide === 1) { // Red
          if (to_x < 3 || to_x > 5 || to_y < 7 || to_y > 9) return false;
        } else { // Black
          if (to_x < 3 || to_x > 5 || to_y < 0 || to_y > 2) return false;
        }
        // One step orthogonal
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

      case 6: // 士 (Advisor)
        // Must stay in palace and move diagonally 1 step
        if (sourceSide === 1) { // Red
          if (to_x < 3 || to_x > 5 || to_y < 7 || to_y > 9) return false;
        } else { // Black
          if (to_x < 3 || to_x > 5 || to_y < 0 || to_y > 2) return false;
        }
        return dx === 1 && dy === 1;

      case 5: // 相 / 象 (Elephant)
        // Move diagonally 2 steps (dx=2, dy=2) and cannot cross river
        if (dx !== 2 || dy !== 2) return false;
        if (sourceSide === 1) { // Red cannot cross river (y: 5..9)
          if (to_y < 5) return false;
        } else { // Black cannot cross river (y: 0..4)
          if (to_y > 4) return false;
        }
        // Check elephant eye
        const eye_x = (from_x + to_x) / 2;
        const eye_y = (from_y + to_y) / 2;
        if (board[eye_y][eye_x] !== 0) return false; // Blocked!
        return true;

      case 3: // 马 (Horse)
        // Move "Ri" (2 in one direction, 1 in perp)
        if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
          // Check horse leg blockage
          let leg_x = from_x;
          let leg_y = from_y;
          if (dy === 2) {
            leg_y = from_y + (to_y > from_y ? 1 : -1);
          } else {
            leg_x = from_x + (to_x > from_x ? 1 : -1);
          }
          if (board[leg_y][leg_x] !== 0) return false; // Blocked!
          return true;
        }
        return false;

      case 2: // 车 (Chariot)
        // Orthogonal move, no pieces in between (0 if move, 1 if capture)
        if (from_x !== to_x && from_y !== to_y) return false;
        const countBetween = this.countPiecesBetween(board, from_x, from_y, to_x, to_y);
        return countBetween === 0;

      case 4: // 炮 (Cannon)
        if (from_x !== to_x && from_y !== to_y) return false;
        const count = this.countPiecesBetween(board, from_x, from_y, to_x, to_y);
        if (target === 0) {
          return count === 0; // Moves like chariot
        } else {
          return count === 1; // Needs exactly 1 "platform" to capture
        }

      case 7: // 兵 / 卒 (Soldier)
        // Only forward, 1 step. Once passed river, can move sideways too.
        if (sourceSide === 1) { // Red (moves up, y decreases)
          const isOverRiver = from_y <= 4;
          if (to_y - from_y > 0) return false; // Non-retreat check
          if (isOverRiver) {
            return (dy === 1 && dx === 0) || (dy === 0 && dx === 1);
          } else {
            return dy === 1 && dx === 0;
          }
        } else { // Black (moves down, y increases)
          const isOverRiver = from_y >= 5;
          if (to_y - from_y < 0) return false; // Non-retreat check
          if (isOverRiver) {
            return (dy === 1 && dx === 0) || (dy === 0 && dx === 1);
          } else {
            return dy === 1 && dx === 0;
          }
        }
    }

    return false;
  }

  private static countPiecesBetween(
    board: number[][],
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    let count = 0;
    if (x1 === x2) {
      const start = Math.min(y1, y2) + 1;
      const end = Math.max(y1, y2);
      for (let y = start; y < end; y++) {
        if (board[y][x1] !== 0) count++;
      }
    } else if (y1 === y2) {
      const start = Math.min(x1, x2) + 1;
      const end = Math.max(x1, x2);
      for (let x = start; x < end; x++) {
        if (board[y1][x] !== 0) count++;
      }
    }
    return count;
  }

  // Check if two kings face each other without any piece in between
  public static isKingFacing(board: number[][], king_red_x: number, king_red_y: number, king_black_x: number, king_black_y: number): boolean {
    if (king_red_x !== king_black_x) return false;
    // Count pieces between
    const start = Math.min(king_red_y, king_black_y) + 1;
    const end = Math.max(king_red_y, king_black_y);
    for (let y = start; y < end; y++) {
      if (board[y][king_red_x] !== 0) {
        return false; // Blocked, so safe
      }
    }
    return true; // King face to face!
  }
}
