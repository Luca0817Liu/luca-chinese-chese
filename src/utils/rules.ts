
import { BoardState, Piece, PieceType, PlayerColor, BOARD_ROWS, BOARD_COLS } from '../types';

export function getValidMoves(piece: Piece, board: BoardState): { r: number; c: number }[] {
  const moves: { r: number; c: number }[] = [];
  const { r, c } = piece.position;

  switch (piece.type) {
    case PieceType.GENERAL:
      // General moves 1 step orthog within palace
      const palaceRows = piece.color === 'red' ? [7, 8, 9] : [0, 1, 2];
      const palaceCols = [3, 4, 5];
      const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
      for (const [nr, nc] of neighbors) {
        if (palaceRows.includes(nr) && palaceCols.includes(nc)) {
          if (!board[nr][nc] || board[nr][nc]?.color !== piece.color) {
            moves.push({ r: nr, c: nc });
          }
        }
      }
      // Special: Flying General (direct line of sight)
      const otherGeneralColor = piece.color === 'red' ? 'black' : 'red';
      let enemyR = -1, enemyC = -1;
      for (let i = 0; i < BOARD_ROWS; i++) {
        for (let j = 0; j < BOARD_COLS; j++) {
          const p = board[i][j];
          if (p && p.type === PieceType.GENERAL && p.color === otherGeneralColor) {
            enemyR = i;
            enemyC = j;
            break;
          }
        }
      }
      if (c === enemyC) {
        let blocked = false;
        const start = Math.min(r, enemyR) + 1;
        const end = Math.max(r, enemyR);
        for (let k = start; k < end; k++) {
          if (board[k][c]) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          moves.push({ r: enemyR, c: enemyC });
        }
      }
      break;

    case PieceType.ADVISOR:
      // Diagonal 1 step within palace
      const advRows = piece.color === 'red' ? [7, 8, 9] : [0, 1, 2];
      const advCols = [3, 4, 5];
      const advNeighbors = [[r-1, c-1], [r-1, c+1], [r+1, c-1], [r+1, c+1]];
      for (const [nr, nc] of advNeighbors) {
        if (advRows.includes(nr) && advCols.includes(nc)) {
          if (!board[nr][nc] || board[nr][nc]?.color !== piece.color) {
            moves.push({ r: nr, c: nc });
          }
        }
      }
      break;

    case PieceType.ELEPHANT:
      // Diagonal 2 steps, cannot cross river, blocked by eye
      const elePossible = [[r-2, c-2], [r-2, c+2], [r+2, c-2], [r+2, c+2]];
      const riverLimit = piece.color === 'red' ? 5 : 4; // Red can't go < 5, Black can't go > 4
      for (const [nr, nc] of elePossible) {
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          // River check
          const crossed = piece.color === 'red' ? nr < 5 : nr > 4;
          if (crossed) continue;

          // Eye check
          const eyeR = (r + nr) / 2;
          const eyeC = (c + nc) / 2;
          if (!board[eyeR][eyeC]) {
            if (!board[nr][nc] || board[nr][nc]?.color !== piece.color) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
      }
      break;

    case PieceType.HORSE:
      // L shape, blocked by leg
      const horseSteps = [
        { dr: -2, dc: -1, lr: -1, lc: 0 }, { dr: -2, dc: 1, lr: -1, lc: 0 },
        { dr: 2, dc: -1, lr: 1, lc: 0 }, { dr: 2, dc: 1, lr: 1, lc: 0 },
        { dr: -1, dc: -2, lr: 0, lc: -1 }, { dr: 1, dc: -2, lr: 0, lc: -1 },
        { dr: -1, dc: 2, lr: 0, lc: 1 }, { dr: 1, dc: 2, lr: 0, lc: 1 },
      ];
      for (const step of horseSteps) {
        const nr = r + step.dr;
        const nc = c + step.dc;
        const lr = r + step.lr;
        const lc = c + step.lc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          if (!board[lr][lc]) { // Leg not blocked
            if (!board[nr][nc] || board[nr][nc]?.color !== piece.color) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
      }
      break;

    case PieceType.CHARIOT:
      // Orthogonal any distance
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          if (!board[nr][nc]) {
            moves.push({ r: nr, c: nc });
          } else {
            if (board[nr][nc]?.color !== piece.color) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
      break;

    case PieceType.CANNON:
      // Movement like Chariot, capture requires 1 jumper
      const cDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of cDirs) {
        let nr = r + dr;
        let nc = c + dc;
        let jumped = false;
        while (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          if (!jumped) {
            if (!board[nr][nc]) {
              moves.push({ r: nr, c: nc });
            } else {
              jumped = true;
            }
          } else {
            if (board[nr][nc]) {
              if (board[nr][nc]?.color !== piece.color) {
                moves.push({ r: nr, c: nc });
              }
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;

    case PieceType.SOLDIER:
      // Forward 1 step, sideway after river
      const forwardDir = piece.color === 'red' ? -1 : 1;
      const overRiver = piece.color === 'red' ? r < 5 : r > 4;
      
      // Forward
      const fR = r + forwardDir;
      if (fR >= 0 && fR < BOARD_ROWS) {
        if (!board[fR][c] || board[fR][c]?.color !== piece.color) {
          moves.push({ r: fR, c });
        }
      }
      
      // Sideway
      if (overRiver) {
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc >= 0 && nc < BOARD_COLS) {
            if (!board[r][nc] || board[r][nc]?.color !== piece.color) {
              moves.push({ r, c: nc });
            }
          }
        }
      }
      break;
  }

  return moves;
}

export function isGameOver(board: BoardState): PlayerColor | 'draw' | null {
  let redGeneral = false;
  let blackGeneral = false;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (p?.type === PieceType.GENERAL) {
        if (p.color === 'red') redGeneral = true;
        if (p.color === 'black') blackGeneral = true;
      }
    }
  }
  if (!redGeneral) return 'black';
  if (!blackGeneral) return 'red';
  return null;
}
