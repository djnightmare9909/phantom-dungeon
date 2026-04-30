/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Point, TileType } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants';

export function computeFOV(origin: Point, maxRadius: number, map: TileType[][], isDark: boolean): Set<string> {
  const visible = new Set<string>();
  visible.add(`${origin.x},${origin.y}`);

  // If it's dark and no light source/darkvision, vision is severely limited
  const actualRadius = isDark ? 2 : maxRadius;
  const stepSize = 0.4;
  const numRays = 180;

  for (let i = 0; i < numRays; i++) {
    const angle = (i * 360) / numRays;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * stepSize;
    const dy = Math.sin(rad) * stepSize;

    let currX = origin.x + 0.5;
    let currY = origin.y + 0.5;

    // We can go up to maxRadius, but since we step by stepSize, we should iterate more
    const maxSteps = actualRadius / stepSize;

    for (let r = 0; r < maxSteps; r++) {
      currX += dx;
      currY += dy;

      const tx = Math.floor(currX);
      const ty = Math.floor(currY);

      if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;

      visible.add(`${tx},${ty}`);

      if (map[ty][tx] === TileType.WALL) break;
    }
  }

  return visible;
}
