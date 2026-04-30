/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ItemType } from '../types';

export function getStarterItems(race: string, pClass: string): Item[] {
  const timestamp = Date.now();
  const items: Item[] = [];

  if (race === 'Elf') {
    items.push({
      id: `starter-bow-${timestamp}`,
      name: 'Elven Longbow',
      type: 'weapon',
      description: 'A finely crafted elven bow.',
      stats: { atk: 3 },
      rarity: 'uncommon',
      range: 8
    });
  } else if (race === 'Demon') {
      items.push({
          id: `starter-fireball-${timestamp}`,
          name: 'Infernal Tome',
          type: 'weapon',
          description: 'Allows casting Fireball.',
          stats: { intelligence: 2, atk: 5 },
          rarity: 'rare',
          range: 6
      });
  } else if (pClass === 'Paladin') {
    items.push({
      id: `starter-sword-${timestamp}`,
      name: 'Holy Avenger',
      type: 'weapon',
      description: 'A glowing blade of justice.',
      stats: { atk: 4 },
      rarity: 'rare',
      range: 4
    });
    items.push({
        id: `starter-shield-${timestamp}`,
        name: 'Paladin Shield',
        type: 'armor',
        description: 'A heavy steel shield.',
        stats: { def: 3 },
        rarity: 'uncommon'
    });
  } else if (race === 'Orc') {
      items.push({
          id: `starter-crossbow-${timestamp}`,
          name: 'Heavy Crossbow',
          type: 'weapon',
          description: 'A powerful mechanical bow.',
          stats: { atk: 4 },
          rarity: 'uncommon',
          range: 8
      });
      items.push({
          id: `starter-mace-${timestamp}`,
          name: 'Spiked Mace',
          type: 'weapon',
          description: 'A brutal crushing weapon.',
          stats: { atk: 3 },
          rarity: 'common'
      });
  } else if (race === 'Dwarf') {
      items.push({
          id: `starter-taxe-${timestamp}`,
          name: 'Throwing Axe',
          type: 'weapon',
          description: 'Balanced for throwing.',
          stats: { atk: 3 },
          rarity: 'common',
          range: 5
      });
      items.push({
          id: `starter-baxe-${timestamp}`,
          name: 'Battle Axe',
          type: 'weapon',
          description: 'Heavy two-handed axe.',
          stats: { atk: 5 },
          rarity: 'uncommon'
      });
  } else {
    items.push({
        id: `starter-dagger-${timestamp}`,
        name: 'Dagger',
        type: 'weapon',
        description: 'Standard issue dagger.',
        stats: { atk: 2 },
        rarity: 'common'
    });
  }

  return items;
}

export function generateDrop(): Item | null {
  const rand = Math.random();
  const timestamp = Date.now() + Math.random();
  
  // 1/100 Ability Boost
  if (rand < 0.01) {
    return {
      id: `boost-${timestamp}`,
      name: 'Forbidden Knowledge',
      type: 'consumable',
      description: 'Increases your Intelligence significantly.',
      stats: { intelligence: 5 },
      rarity: 'epic'
    };
  }

  // 1/60 Armor
  if (rand < 0.01 + 1/60) {
      return {
          id: `armor-${timestamp}`,
          name: 'Rusty Chainmail',
          type: 'armor',
          description: 'Offers moderate protection.',
          stats: { def: 2 },
          rarity: 'uncommon'
      };
  }

  // 1/20 Weapon
  if (rand < 0.01 + 1/60 + 0.05) {
      return {
          id: `wep-${timestamp}`,
          name: 'Balanced Blade',
          type: 'weapon',
          description: 'A well-crafted sword.',
          stats: { atk: 4 },
          rarity: 'rare'
      };
  }

  // 1/10 Healing Item
  if (rand < 0.01 + 1/60 + 0.05 + 0.10) {
      return {
          id: `heal-${timestamp}`,
          name: 'Minor Elixir',
          type: 'consumable',
          description: 'Restores health.',
          stats: { hp: 10 },
          rarity: 'common'
      };
  }

  // Trash items (majority - ~70%)
  if (rand < 0.8) {
      if (Math.random() < 0.4) {
          return {
              id: `trash-armor-${timestamp}`,
              name: 'Broken Plate',
              type: 'armor',
              description: 'A shattered breastplate. Too damaged to wear, but might contain scraps of padding.',
              stats: { def: 0 },
              rarity: 'common'
          };
      }
      return {
          id: `trash-${timestamp}`,
          name: 'Broken Hilt',
          type: 'trash',
          description: 'Useless in its current state. Can be disassembled.',
          rarity: 'common'
      };
  }

  return null;
}

export function disassembleItem(item: Item, userStats: any): Item[] {
  const userIntelligence = userStats.intelligence || 10;
  // Low intelligence check
  const failChance = Math.max(0, 0.5 - (userIntelligence / 40));
  if (Math.random() < failChance) return [];

  const materials: Item[] = [];
  const timestamp = Date.now();

  if (item.type === 'armor') {
      const ragCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < ragCount; i++) {
          materials.push({
              id: `rag-${timestamp}-${i}`,
              name: 'Cloth Rags',
              type: 'material',
              description: 'Dirty scraps of cloth. Useful for making torches.',
              rarity: 'common'
          });
      }
  } else {
      // Success: Return materials based on intelligence
      const materialCount = Math.floor(userIntelligence / 10) + 1;
      
      for(let i=0; i<materialCount; i++) {
          materials.push({
              id: `mat-${timestamp}-${Math.random()}-${i}`,
              name: 'Scrap Metal',
              type: 'material',
              description: 'Basic material for crafting (or selling).',
              rarity: 'common'
          });
      }
  }
  
  return materials;
}
