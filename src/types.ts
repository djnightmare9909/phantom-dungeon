/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TileType {
  WALL = 'WALL',
  FLOOR = 'FLOOR',
  STAIRS_DOWN = 'STAIRS_DOWN',
  VOID = 'VOID',
  CHEST = 'CHEST',
  OIL_PIT = 'OIL_PIT'
}

export interface Point {
  x: number;
  y: number;
}

export type Race = 'Human' | 'Elf' | 'Orc' | 'Demon' | 'Dwarf';
export type Class = 'Paladin' | 'Ranger' | 'Wizard' | 'Fighter';

export interface Stats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  intelligence: number;
  xp: number;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  wisdom: number;
  charisma: number;
}

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'trash' | 'material' | 'tool';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  stats?: Partial<Stats>;
  value?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  range?: number;
}

export interface GroundItem {
  id: string;
  item: Item;
  position: Point;
}

export interface Entity {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  position: Point;
  stats: Stats;
  symbol: string;
  color: string;
}

export interface GameMessage {
  text: string;
  type: 'info' | 'combat' | 'danger' | 'success';
}

export interface GameState {
  player: Entity;
  playerRace: Race;
  playerClass: Class;
  enemies: Entity[];
  itemsOnGround: GroundItem[];
  inventory: Item[];
  equipped: {
    weapon: Item | null;
    armor: Item | null;
  };
  map: TileType[][];
  visibleTiles: Set<string>; // "x,y" format
  exploredTiles: Set<string>;
  messages: GameMessage[];
  floor: number;
  isGameOver: boolean;
  aimingDirection: Point | null;
  isInventoryOpen: boolean;
  isCharacterCreationOpen: boolean;
  lightLevel: number;
  hasDarkVision: boolean;
}
