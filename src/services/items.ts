/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ItemType } from '../types';

export const SYNERGY_MAP: Record<string, { traits: string[]; bonusItems?: Item[] }> = {
  'Demon-Paladin': {
    traits: ['darkvision', 'hellknight', 'fireSmite'],
    bonusItems: [
      {
        id: `synergy-infernal-blade-${Date.now()}`,
        name: 'Infernal Blade',
        type: 'weapon',
        description: 'A demon-forged paladin blade that sears enemies.',
        stats: { atk: 5 },
        rarity: 'rare',
        range: 1,
      }
    ],
  },
  'Elf-Ranger': {
      traits: ['darkvision', 'elvenAccuracy'],
      bonusItems: [
          {
              id: `synergy-leaf-armor-${Date.now()}`,
              name: 'Leaf-Woven Tunic',
              type: 'armor',
              description: 'Lightweight armor that blends with the shadows.',
              stats: { def: 2, dexterity: 2 },
              rarity: 'uncommon'
          }
      ]
  },
  'Dragonborn-Barbarian': {
      traits: ['breathWeapon', 'unarmoredDefense'],
      bonusItems: [
          {
              id: `synergy-draconic-axe-${Date.now()}`,
              name: 'Drake-Glass Greataxe',
              type: 'weapon',
              description: 'A heavy axe infused with draconic heat.',
              stats: { atk: 6 },
              rarity: 'rare'
          }
      ]
  },
  'Tiefling-Warlock': {
      traits: ['darkvision', 'hellishRebuke'],
      bonusItems: [
          {
              id: `synergy-fiendish-staff-${Date.now()}`,
              name: 'Obsidian Staff',
              type: 'weapon',
              description: 'Channels eldritch energy from the abyss.',
              stats: { intelligence: 3, atk: 4 },
              rarity: 'rare',
              range: 5
          }
      ]
  }
};

export function getStarterItems(race: string, pClass: string): Item[] {
  const timestamp = Date.now();
  const items: Item[] = [];

  // Every character gets a basic ranged weapon
  items.push({
    id: `starter-sling-${timestamp}`,
    name: 'Hunting Sling',
    type: 'weapon',
    description: 'A simple leather sling for throwing stones.',
    stats: { atk: 1 },
    rarity: 'common',
    range: 6
  });

  // Synergy logic
  const key = `${race}-${pClass}`;
  const synergy = SYNERGY_MAP[key];
  if (synergy?.bonusItems) {
      items.push(...synergy.bonusItems);
  }

  // Race Based Items
  if (race === 'Elf' || race === 'Half-Elf') {
    items.push({
      id: `starter-bow-${timestamp}`,
      name: 'Elven Longbow',
      type: 'weapon',
      description: 'A finely crafted elven bow.',
      stats: { atk: 3 },
      rarity: 'uncommon',
      range: 8
    });
  } else if (race === 'Dragonborn') {
      items.push({
          id: `starter-scale-${timestamp}`,
          name: 'Dragon Scale Scraps',
          type: 'material',
          description: 'Used for hardening equipment.',
          rarity: 'uncommon'
      });
  } else if (race === 'Tiefling') {
      items.push({
          id: `starter-tome-${timestamp}`,
          name: 'Infernal Primer',
          type: 'weapon',
          description: 'Basic demonic magic.',
          stats: { intelligence: 1, atk: 3 },
          rarity: 'common',
          range: 4
      });
  } else if (race === 'Dwarf') {
      items.push({
          id: `starter-baxe-${timestamp}`,
          name: 'Battle Axe',
          type: 'weapon',
          description: 'Solid dwarven steel.',
          stats: { atk: 5 },
          rarity: 'uncommon'
      });
  } else if (race === 'Half-Orc') {
      items.push({
          id: `starter-club-${timestamp}`,
          name: 'Iron-Spiked Club',
          type: 'weapon',
          description: 'Simple and effective.',
          stats: { atk: 4 },
          rarity: 'common'
      });
  }

  // Class Based Items
  if (pClass === 'Paladin' || pClass === 'Cleric') {
    items.push({
      id: `starter-mace-${timestamp}`,
      name: 'Holy Mace',
      type: 'weapon',
      description: 'Blessed by the gods.',
      stats: { atk: 4 },
      rarity: 'uncommon'
    });
    items.push({
        id: `starter-shield-${timestamp}`,
        name: 'Iron Shield',
        type: 'armor',
        description: 'Standard shield.',
        stats: { def: 2 },
        rarity: 'common'
    });
  } else if (pClass === 'Wizard' || pClass === 'Sorcerer') {
      items.push({
          id: `starter-staff-${timestamp}`,
          name: 'Willow Wand',
          type: 'weapon',
          description: 'Focuses minor spells.',
          stats: { intelligence: 2, atk: 2 },
          rarity: 'common',
          range: 5
      });
  } else if (pClass === 'Rogue' || pClass === 'Bard') {
      items.push({
          id: `starter-rapier-${timestamp}`,
          name: 'Slim Rapier',
          type: 'weapon',
          description: 'Fast and graceful.',
          stats: { atk: 3, dexterity: 1 },
          rarity: 'uncommon'
      });
  } else if (pClass === 'Barbarian' || pClass === 'Fighter') {
      items.push({
          id: `starter-sword-${timestamp}`,
          name: 'Soldier\'s Blade',
          type: 'weapon',
          description: 'Reliable iron sword.',
          stats: { atk: 4 },
          rarity: 'common'
      });
  } else if (pClass === 'Monk') {
      items.push({
          id: `starter-fist-${timestamp}`,
          name: 'Weighted Wraps',
          type: 'weapon',
          description: 'Strengthens your punches.',
          stats: { atk: 3, dexterity: 1 },
          rarity: 'uncommon'
      });
  } else if (pClass === 'Druid' || pClass === 'Ranger') {
      items.push({
          id: `starter-scimitar-${timestamp}`,
          name: 'Curved Scimitar',
          type: 'weapon',
          description: 'A woodsman\'s blade.',
          stats: { atk: 3 },
          rarity: 'common'
      });
  }

  if (items.length === 0) {
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
  // CRITICAL: Prevent disassembling materials/consumables to stop infinite loops
  if (item.type === 'material' || item.type === 'consumable') return [];

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
