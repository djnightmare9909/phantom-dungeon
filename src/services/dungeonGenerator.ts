/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileType, Point } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants';

class Room {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get center(): Point {
    return {
      x: Math.floor(this.x + this.w / 2),
      y: Math.floor(this.y + this.h / 2)
    };
  }
}

export function generateDungeon() {
  const map: TileType[][] = Array(MAP_HEIGHT)
    .fill(null)
    .map(() => Array(MAP_WIDTH).fill(TileType.WALL));

  const rooms: Room[] = [];
  const minRoomSize = 5;

  function splitLeaf(x: number, y: number, w: number, h: number, depth: number) {
    if (depth <= 0 || (w <= minRoomSize * 2 && h <= minRoomSize * 2)) {
      if (w >= minRoomSize && h >= minRoomSize) {
        // Carve room
        const rw = Math.floor(Math.random() * (w - 4)) + 4;
        const rh = Math.floor(Math.random() * (h - 4)) + 4;
        const rx = x + Math.floor((w - rw) / 2);
        const ry = y + Math.floor((h - rh) / 2);
        
        rooms.push(new Room(rx, ry, rw, rh));
        for (let i = ry; i < ry + rh; i++) {
          for (let j = rx; j < rx + rw; j++) {
            if (i >= 0 && i < MAP_HEIGHT && j >= 0 && j < MAP_WIDTH) {
              map[i][j] = TileType.FLOOR;
            }
          }
        }
      }
      return;
    }

    const splitH = w / h > 1.25 ? false : h / w > 1.25 ? true : Math.random() < 0.5;
    
    if (splitH) {
      const split = Math.floor(Math.random() * (h - minRoomSize * 2)) + minRoomSize;
      splitLeaf(x, y, w, split, depth - 1);
      splitLeaf(x, y + split, w, h - split, depth - 1);
    } else {
      const split = Math.floor(Math.random() * (w - minRoomSize * 2)) + minRoomSize;
      splitLeaf(x, y, split, h, depth - 1);
      splitLeaf(x + split, y, w - split, h, depth - 1);
    }
  }

  splitLeaf(1, 1, MAP_WIDTH - 2, MAP_HEIGHT - 2, 4);

  if (rooms.length === 0) {
    // Fallback: create one large room
    const w = 10;
    const h = 10;
    const x = Math.floor(MAP_WIDTH / 2 - 5);
    const y = Math.floor(MAP_HEIGHT / 2 - 5);
    rooms.push(new Room(x, y, w, h));
    for (let i = y; i < y + h; i++) {
        for (let j = x; j < x + w; j++) {
            map[i][j] = TileType.FLOOR;
        }
    }

    // Add extra features to rooms
    if (Math.random() > 0.5) {
        const cx = x + 1 + Math.floor(Math.random() * (w - 2));
        const cy = y + 1 + Math.floor(Math.random() * (h - 2));
        map[cy][cx] = TileType.CHEST;
    }
    if (Math.random() > 0.7) {
        const ox = x + 1 + Math.floor(Math.random() * (w - 2));
        const oy = y + 1 + Math.floor(Math.random() * (h - 2));
        map[oy][ox] = TileType.OIL_PIT;
    }
  }

  // Connect rooms
  for (let i = 0; i < rooms.length - 1; i++) {
    const c1 = rooms[i].center;
    const c2 = rooms[i + 1].center;
    carveCorridor(map, c1, c2);

    // Add extra features to rooms
    const r = rooms[i];
    if (Math.random() > 0.7) {
        const cx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
        const cy = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
        map[cy][cx] = TileType.CHEST;
    }
    if (Math.random() > 0.8) {
        const ox = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
        const oy = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
        map[oy][ox] = TileType.OIL_PIT;
    }
    if (Math.random() > 0.8) {
        const wx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
        const wy = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
        map[wy][wx] = TileType.WATER_PIT;
    }
  }

  // Stairs in last room
  const lastC = rooms[rooms.length - 1].center;
  map[lastC.y][lastC.x] = TileType.STAIRS_DOWN;

  return { map, rooms };
}

function carveCorridor(map: TileType[][], a: Point, b: Point) {
  let currX = a.x;
  let currY = a.y;

  while (currX !== b.x) {
    currX += Math.sign(b.x - currX);
    if (currY >= 0 && currY < MAP_HEIGHT && currX >= 0 && currX < MAP_WIDTH) {
      map[currY][currX] = TileType.FLOOR;
    }
  }
  while (currY !== b.y) {
    currY += Math.sign(b.y - currY);
    if (currY >= 0 && currY < MAP_HEIGHT && currX >= 0 && currX < MAP_WIDTH) {
      map[currY][currX] = TileType.FLOOR;
    }
  }
}
