/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 40;
export const TILE_SIZE = 20;

export const INITIAL_PLAYER_STATS = {
  hp: 20,
  maxHp: 20,
  atk: 0,
  def: 0,
  intelligence: 10,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  wisdom: 10,
  charisma: 10,
  xp: 0,
  level: 1
};

export const MONSTER_TYPES = [
  { name: 'Goblin', symbol: 'g', color: 'text-green-500', stats: { hp: 10, maxHp: 10, atk: 3, def: 1, intelligence: 5, xp: 10, level: 1, strength: 10, dexterity: 12, constitution: 10, wisdom: 8, charisma: 8 } },
  { name: 'Orc', symbol: 'o', color: 'text-orange-600', stats: { hp: 15, maxHp: 15, atk: 4, def: 2, intelligence: 8, xp: 20, level: 2, strength: 14, dexterity: 10, constitution: 14, wisdom: 9, charisma: 7 } },
  { name: 'Skeleton', symbol: 's', color: 'text-gray-300', stats: { hp: 8, maxHp: 8, atk: 4, def: 0, intelligence: 2, xp: 15, level: 1, strength: 11, dexterity: 11, constitution: 10, wisdom: 5, charisma: 4 } },
];
