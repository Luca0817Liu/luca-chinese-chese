import { SideType, Move, MoveSnapshot } from './types';
import { Rule } from './Rule';

export class State {
  public board: number[][]; // 10 rows (y), 9 cols (x)
  public side: SideType;    // 1 = Red, 2 = Black
  public king_red_x: number = 4;
  public king_red_y: number = 9;
  public king_black_x: number = 4;
  public king_black_y: number = 0;
  public move_stack: MoveSnapshot[] = [];

  constructor(board?: number[][], side: SideType = 1) {
    if (board) {
      this.board = board.map(row => [...row]);
    } else {
      this.board = Array(10).fill(0).map(() => Array(9).fill(0));
      this.setupInitialPosition();
    }
    this.side = side;
    this.findKings();
  }

  private setupInitialPosition() {
    // Black pieces (y = 0..3)
    this.board[0][0] = 22; // 车
    this.board[0][1] = 23; // 马
    this.board[0][2] = 25; // 象
    this.board[0][3] = 26; // 士
    this.board[0][4] = 21; // 将
    this.board[0][5] = 26; // 士
    this.board[0][6] = 25; // 象
    this.board[0][7] = 23; // 马
    this.board[0][8] = 22; // 车
    this.board[2][1] = 24; // 炮
    this.board[2][7] = 24; // 炮
    this.board[3][0] = 27; // 卒
    this.board[3][2] = 27; // 卒
    this.board[3][4] = 27; // 卒
    this.board[3][6] = 27; // 卒
    this.board[3][8] = 27; // 卒

    // Red pieces (y = 6..9)
    this.board[9][0] = 12; // 车
    this.board[9][1] = 13; // 马
    this.board[9][2] = 15; // 相
    this.board[9][3] = 16; // 士
    this.board[9][4] = 11; // 帅
    this.board[9][5] = 16; // 士
    this.board[9][6] = 15; // 相
    this.board[9][7] = 13; // 马
    this.board[9][8] = 12; // 车
    this.board[7][1] = 14; // 炮
    this.board[7][7] = 14; // 炮
    this.board[6][0] = 17; // 兵
    this.board[6][2] = 17; // 兵
    this.board[6][4] = 17; // 兵
    this.board[6][6] = 17; // 兵
    this.board[6][8] = 17; // 兵
  }

  public findKings() {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (piece === 11) {
          this.king_red_x = x;
          this.king_red_y = y;
        } else if (piece === 21) {
          this.king_black_x = x;
          this.king_black_y = y;
        }
      }
    }
  }

  public clone(): State {
    const newState = new State(this.board, this.side);
    newState.king_red_x = this.king_red_x;
    newState.king_red_y = this.king_red_y;
    newState.king_black_x = this.king_black_x;
    newState.king_black_y = this.king_black_y;
    newState.move_stack = [...this.move_stack];
    return newState;
  }

  public make_move(from_x: number, from_y: number, to_x: number, to_y: number): number {
    const piece = this.board[from_y][from_x];
    const target = this.board[to_y][to_x];

    // Save snapshot
    this.move_stack.push({
      from_x,
      from_y,
      to_x,
      to_y,
      capture: target,
      prev_king_red_x: this.king_red_x,
      prev_king_red_y: this.king_red_y,
      prev_king_black_x: this.king_black_x,
      prev_king_black_y: this.king_black_y,
    });

    // Move
    this.board[to_y][to_x] = piece;
    this.board[from_y][from_x] = 0;

    // Maintain king pos Cache
    if (piece === 11) {
      this.king_red_x = to_x;
      this.king_red_y = to_y;
    } else if (piece === 21) {
      this.king_black_x = to_x;
      this.king_black_y = to_y;
    }

    // Toggle turn
    this.side = this.side === 1 ? 2 : 1;

    return target;
  }

  public unmake_move() {
    if (this.move_stack.length === 0) return;
    const snap = this.move_stack.pop()!;

    const piece = this.board[snap.to_y][snap.to_x];
    this.board[snap.from_y][snap.from_x] = piece;
    this.board[snap.to_y][snap.to_x] = snap.capture;

    this.king_red_x = snap.prev_king_red_x;
    this.king_red_y = snap.prev_king_red_y;
    this.king_black_x = snap.prev_king_black_x;
    this.king_black_y = snap.prev_king_black_y;

    this.side = this.side === 1 ? 2 : 1;
  }

  public get_king_pos(side: SideType): { x: number; y: number } {
    if (side === 1) {
      return { x: this.king_red_x, y: this.king_red_y };
    } else {
      return { x: this.king_black_x, y: this.king_black_y };
    }
  }

  public is_check(side: SideType): boolean {
    const kPos = this.get_king_pos(side);
    const opponentSide: SideType = side === 1 ? 2 : 1;

    // Search if any opponent piece can capture this king position
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (piece !== 0 && Math.floor(piece / 10) === opponentSide) {
          if (Rule.isValidMoveBasic(this.board, x, y, kPos.x, kPos.y)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
