export type SideType = 1 | 2; // 1 = Red, 2 = Black

export interface Move {
  from_x: number; // 0..8
  from_y: number; // 0..9
  to_x: number;   // 0..8
  to_y: number;   // 0..9
  capture: number; // 0 means no capture, otherwise the captured piece code
}

export interface MoveSnapshot {
  from_x: number;
  from_y: number;
  to_x: number;
  to_y: number;
  capture: number;
  prev_king_red_x: number;
  prev_king_red_y: number;
  prev_king_black_x: number;
  prev_king_black_y: number;
}
