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
  OIL_PIT = 'OIL_PIT',
  WATER_PIT = 'WATER_PIT'
}

export interface Point {
  x: number;
  y: number;
}

export type Race = 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Dragonborn' | 'Gnome' | 'Half-Elf' | 'Half-Orc' | 'Tiefling';
export type Class = 'Barbarian' | 'Bard' | 'Cleric' | 'Druid' | 'Fighter' | 'Monk' | 'Paladin' | 'Ranger' | 'Rogue' | 'Sorcerer' | 'Warlock' | 'Wizard';

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

export interface CharacterSheet {
  name: string;
  race: Race;
  pClass: Class;
  stats: Stats;            // raw attributes (strength, dexterity, etc.)
  modifiers: {
    meleeAttack: number;   // (str-10)/2
    rangedAttack: number;  // (dex-10)/2
    defense: number;       // (dex-10)/2
    spellPower: number;    // (int-10)/2
    torchCraftBonus: number; // int modifier affects craft success
    disassembleBonus: number;
  };
  racialTraits: string[];  // e.g. 'darkvision', 'elvenAccuracy'
  classTraits: string[];   // e.g. 'smite', 'rangedSpecialist'
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
  characterSheet: CharacterSheet | null;
  enemies: Entity[];
  itemsOnGround: GroundItem[];
  inventory: Item[];
  equipped: {
    weapon: Item | null;
    ranged: Item | null;
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
  torchTimer: number;
  shopOpen: boolean;
  shopkeeper: {
    inventory: Item[];
    hostile: boolean;
    position: Point;
    stats?: Stats; // boss stats if hostile
  } | null;
}
