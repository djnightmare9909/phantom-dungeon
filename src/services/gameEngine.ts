/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { CharacterSheet, GameState, Point, TileType, Entity, GameMessage, Item, GroundItem, Race, Class } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, INITIAL_PLAYER_STATS, MONSTER_TYPES } from '../constants';
import { generateDungeon } from './dungeonGenerator';
import { computeFOV } from './fovService';
import { getStarterItems, generateDrop, disassembleItem } from './items';

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initGame = useCallback((floor = 1, charSheet?: CharacterSheet) => {
    const { map, rooms } = generateDungeon();
    const playerPos = rooms[0].center;
    
    if (!charSheet && floor === 1) {
        setGameState(null);
        return;
    }

    const playerStats = charSheet?.stats || { ...INITIAL_PLAYER_STATS };
    const player: Entity = {
      id: 'player',
      name: charSheet?.name || 'Hero',
      type: 'player',
      position: playerPos,
      stats: playerStats,
      symbol: '@',
      color: 'text-yellow-400'
    };

    const hasDarkVision = charSheet?.racialTraits.includes('darkvision');
    const initialFOV = computeFOV(playerPos, 10, map, !hasDarkVision);
    const starterItems = getStarterItems(charSheet?.race || 'Human', charSheet?.pClass || 'Fighter');
    
    // Auto-equip logic
    const starterWeapon = starterItems
        .filter(i => i.type === 'weapon' && (!i.range || i.range <= 1))
        .sort((a, b) => (b.stats?.atk || 0) - (a.stats?.atk || 0))[0] || null;
        
    const starterRanged = starterItems
        .filter(i => i.type === 'weapon' && i.range && i.range > 1)
        .sort((a, b) => (b.stats?.atk || 0) - (a.stats?.atk || 0))[0] || null;
        
    const starterArmor = starterItems
        .filter(i => i.type === 'armor')
        .sort((a, b) => (b.stats?.def || 0) - (a.stats?.def || 0))[0] || null;

    setGameState(prev => ({
      player,
      playerRace: charSheet?.race || prev?.playerRace || 'Human',
      playerClass: charSheet?.pClass || prev?.playerClass || 'Fighter',
      characterSheet: charSheet || prev?.characterSheet || null,
      enemies: [],
      itemsOnGround: [],
      inventory: [...starterItems],
      equipped: {
        weapon: starterWeapon,
        ranged: starterRanged,
        armor: starterArmor
      },
      map,
      visibleTiles: initialFOV,
      exploredTiles: new Set(initialFOV),
      messages: [{ text: `Welcome to floor ${floor}!`, type: 'info' }],
      floor,
      isGameOver: false,
      aimingDirection: null,
      isInventoryOpen: false,
      isCharacterCreationOpen: floor === 1 && !charSheet,
      lightLevel: hasDarkVision ? 100 : 20,
      hasDarkVision,
      torchTimer: 0,
      shopOpen: false,
      shopkeeper: null
    } as GameState));

    // Spawn enemies
    setGameState(prev => {
        if (!prev) return null;
        const enemies: Entity[] = [];
        let shopkeeper = null;
        
        for (let i = 1; i < rooms.length; i++) {
            // Spawn Shopkeeper in the second room if floor is 2+
            if (i === 1 && floor >= 1) {
                shopkeeper = {
                    inventory: [
                        { id: `shop-torch-${Date.now()}`, name: 'Torch', type: 'consumable', description: 'Essential for survival.', value: 5, rarity: 'common' },
                        { id: `shop-elixir-${Date.now()}`, name: 'Health Elixir', type: 'consumable', description: 'Restores 20 HP.', stats: { hp: 20 }, value: 15, rarity: 'uncommon' },
                        { id: `shop-sword-${Date.now()}`, name: 'Steel Longsword', type: 'weapon', description: 'A sturdy blade.', stats: { atk: 6 }, value: 30, rarity: 'rare' },
                    ] as Item[],
                    hostile: false,
                    position: rooms[i].center,
                    stats: { ...INITIAL_PLAYER_STATS, hp: 100, maxHp: 100, atk: 15, def: 10 }
                };
            } else {
                const numEnemies = Math.floor(Math.random() * 2) + 1;
                for(let j=0; j<numEnemies; j++) {
                    const monster = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
                    const pos = {
                        x: rooms[i].x + 1 + Math.floor(Math.random() * (rooms[i].w - 2)),
                        y: rooms[i].y + 1 + Math.floor(Math.random() * (rooms[i].h - 2))
                    };
                    enemies.push({
                        id: `enemy-${floor}-${i}-${j}`,
                        name: monster.name,
                        type: 'enemy',
                        position: pos,
                        stats: { ...monster.stats },
                        symbol: monster.symbol,
                        color: monster.color
                    });
                }
            }
        }
        return { ...prev, enemies, shopkeeper };
    });
  }, []);

  const addMessage = useCallback((text: string, type: GameMessage['type'] = 'info') => {
    setGameState(prev => {
        if (!prev) return null;
        const newMessages = [{ text, type }, ...prev.messages].slice(0, 50);
        return { ...prev, messages: newMessages };
    });
  }, []);

  const advanceTurnInner = (prev: GameState, newPlayerPos: Point): GameState => {
    if (prev.isGameOver) return prev;

    let updatedPlayer = { ...prev.player, stats: { ...prev.player.stats }, position: newPlayerPos };
    let updatedEnemies = [...prev.enemies];
    let updatedMessages = [...prev.messages];
    let updatedGroundItems = [...prev.itemsOnGround];
    let isGameOver = false;

    // Light & Torch depletion
    let updatedTorchTimer = prev.torchTimer;
    let updatedLightLevel = prev.lightLevel;

    if (prev.hasDarkVision) {
        updatedLightLevel = 100;
    } else if (updatedTorchTimer > 0) {
        updatedTorchTimer -= 1;
        updatedLightLevel = 100;
        if (updatedTorchTimer === 0) {
            updatedMessages.unshift({ text: "Your torch dies out. Darkness encloses.", type: 'danger' });
            updatedLightLevel = 20;
        }
    } else {
        updatedLightLevel = Math.max(0, prev.lightLevel - 0.1);
    }

    // Enemy Actions
    let totalDamageTaken = 0;
    if (prev.shopkeeper && prev.shopkeeper.hostile) {
        const shopkeeper = prev.shopkeeper;
        const dist = Math.sqrt(Math.pow(shopkeeper.position.x - newPlayerPos.x, 2) + Math.pow(shopkeeper.position.y - newPlayerPos.y, 2));
        if (dist <= 1.1) {
            const dmg = Math.max(1, (shopkeeper.stats?.atk || 0) - (prev.equipped.armor?.stats?.def || prev.characterSheet?.modifiers.defense || 0));
            totalDamageTaken += dmg;
            updatedMessages.unshift({ text: `The Shopkeeper strikes you with fury for ${dmg} damage!`, type: 'danger' });
        }
    }

    updatedEnemies = updatedEnemies.map(enemy => {
      const dist = Math.sqrt(Math.pow(enemy.position.x - newPlayerPos.x, 2) + Math.pow(enemy.position.y - newPlayerPos.y, 2));
      
      if (dist <= 1.1) {
          const dmg = Math.max(1, enemy.stats.atk - (prev.equipped.armor?.stats?.def || prev.characterSheet?.modifiers.defense || 0));
          totalDamageTaken += dmg;
          updatedMessages.unshift({ text: `${enemy.name} hits you for ${dmg} damage!`, type: 'danger' });
          return enemy;
      } else if (dist < 8) {
          const dx = Math.sign(newPlayerPos.x - enemy.position.x);
          const dy = Math.sign(newPlayerPos.y - enemy.position.y);
          const target = { x: enemy.position.x + dx, y: enemy.position.y + dy };
          
          const tile = prev.map[target.y][target.x];
          const isWalkable = tile !== TileType.WALL && tile !== TileType.VOID;
          const isOccupied = updatedEnemies.some(e => e.id !== enemy.id && e.position.x === target.x && e.position.y === target.y) || (target.x === newPlayerPos.x && target.y === newPlayerPos.y);

          if (isWalkable && !isOccupied) {
              return { ...enemy, position: target };
          }
      }
      return enemy;
    });

    updatedPlayer.stats.hp -= totalDamageTaken;
    if (updatedPlayer.stats.hp <= 0) {
        isGameOver = true;
        updatedMessages.unshift({ text: `### YOU HAVE DIED (Total Turn Damage: ${totalDamageTaken}) ###`, type: 'danger' });
    }

    // Pick up items
    let updatedInventory = [...prev.inventory];
    const itemsAtPos = updatedGroundItems.filter(i => i.position.x === newPlayerPos.x && i.position.y === newPlayerPos.y);
    if (itemsAtPos.length > 0) {
        itemsAtPos.forEach(gi => {
            updatedMessages.unshift({ text: `Picked up ${gi.item.name}.`, type: 'success' });
            updatedInventory.push(gi.item);
        });
        updatedGroundItems = updatedGroundItems.filter(i => !(i.position.x === newPlayerPos.x && i.position.y === newPlayerPos.y));
    }

    const isDark = !prev.hasDarkVision && updatedLightLevel < 10;
    const newFOV = computeFOV(updatedPlayer.position, 10, prev.map, isDark);
    const newExplored = new Set(prev.exploredTiles);
    newFOV.forEach(t => newExplored.add(t));

    return {
      ...prev,
      player: updatedPlayer,
      enemies: updatedEnemies,
      itemsOnGround: updatedGroundItems,
      inventory: updatedInventory,
      visibleTiles: newFOV,
      exploredTiles: newExplored,
      messages: updatedMessages.slice(0, 50),
      isGameOver,
      lightLevel: updatedLightLevel,
      torchTimer: updatedTorchTimer
    };
  };

  const movePlayer = useCallback((dir: Point) => {
    // We need to check for stairs OUTSIDE the functional update because nextFloor triggers its own state update
    setGameState(prev => {
        if (!prev || prev.isGameOver || prev.isInventoryOpen) return prev;

        const nextPos = {
            x: prev.player.position.x + dir.x,
            y: prev.player.position.y + dir.y
        };

        if (nextPos.x < 0 || nextPos.x >= MAP_WIDTH || nextPos.y < 0 || nextPos.y >= MAP_HEIGHT) return prev;
        
        const tile = prev.map[nextPos.y][nextPos.x];
        if (tile === TileType.WALL || tile === TileType.VOID) return prev;
        
        // STAIRS HANDLING: We use a timeout to escape the current state update cycle
        if (tile === TileType.STAIRS_DOWN) {
            setTimeout(() => nextFloor(), 0);
            return prev;
        }

        // Combat/Interaction Checks
        const enemyIndex = prev.enemies.findIndex(e => e.position.x === nextPos.x && e.position.y === nextPos.y);
        if (enemyIndex !== -1) {
            const enemy = prev.enemies[enemyIndex];
            const playerAtk = (prev.characterSheet?.modifiers.meleeAttack || 0) + (prev.equipped.weapon?.stats?.atk || 0);
            const dmg = Math.max(1, playerAtk - enemy.stats.def);
            
            const updatedEnemies = [...prev.enemies];
            const updatedGroundItems = [...prev.itemsOnGround];
            updatedEnemies[enemyIndex].stats.hp -= dmg;
            
            const updatedMessages: GameMessage[] = [{ text: `You strike ${enemy.name} for ${dmg} damage!`, type: 'combat' }, ...prev.messages];
            
            if (updatedEnemies[enemyIndex].stats.hp <= 0) {
                updatedMessages.unshift({ text: `${enemy.name} dies!`, type: 'success' });
                const drop = generateDrop();
                if (drop) {
                    updatedGroundItems.push({
                        id: `ground-${Date.now()}`,
                        item: drop,
                        position: { ...enemy.position }
                    });
                }
                updatedEnemies.splice(enemyIndex, 1);
            }
            return advanceTurnInner({ ...prev, enemies: updatedEnemies, itemsOnGround: updatedGroundItems, messages: updatedMessages.slice(0, 50) }, prev.player.position);
        }

        // Shopkeeper Check
        if (prev.shopkeeper && prev.shopkeeper.position.x === nextPos.x && prev.shopkeeper.position.y === nextPos.y) {
            if (prev.shopkeeper.hostile) {
                const dmg = Math.max(1, ((prev.characterSheet?.modifiers.meleeAttack || 0) + (prev.equipped.weapon?.stats?.atk || 0)) - (prev.shopkeeper.stats?.def || 0));
                const updatedShopkeeper = { ...prev.shopkeeper, stats: { ...prev.shopkeeper.stats!, hp: prev.shopkeeper.stats!.hp - dmg } };
                const messages = [{ text: `You strike the Shopkeeper for ${dmg} damage!`, type: 'combat' } as GameMessage, ...prev.messages];
                
                if (updatedShopkeeper.stats!.hp <= 0) {
                   messages.unshift({ text: "Merchant falls! You loot his gear.", type: 'success' });
                   return advanceTurnInner({ ...prev, shopkeeper: null, inventory: [...prev.inventory, ...updatedShopkeeper.inventory], messages: messages.slice(0, 50) }, prev.player.position);
                }
                return advanceTurnInner({ ...prev, shopkeeper: updatedShopkeeper, messages: messages.slice(0, 50) }, prev.player.position);
            } else {
                return { ...prev, shopOpen: true };
            }
        }

        // Feature Tiles
        let modifiedPrev = { ...prev };
        if (tile === TileType.CHEST) {
            modifiedPrev.inventory = [...prev.inventory, { id: `sc-${Date.now()}`, name: 'Scrap Metal', type: 'material', description: 'Trade value.', rarity: 'common', value: 1 }];
            modifiedPrev.messages = [{ text: "Looted a chest!", type: 'success' } as GameMessage, ...prev.messages].slice(0, 50);
            const newMap = [...prev.map];
            newMap[nextPos.y] = [...newMap[nextPos.y]];
            newMap[nextPos.y][nextPos.x] = TileType.FLOOR;
            modifiedPrev.map = newMap;
        } else if (tile === TileType.OIL_PIT) {
            modifiedPrev.lightLevel = 100;
            modifiedPrev.torchTimer = 150;
            modifiedPrev.messages = [{ text: "Torch refueled in the oil pit!", type: 'success' } as GameMessage, ...prev.messages].slice(0, 50);
        } else if (tile === TileType.WATER_PIT) {
            const heal = Math.ceil(prev.player.stats.maxHp * 0.3);
            modifiedPrev.player = { ...prev.player, stats: { ...prev.player.stats, hp: Math.min(prev.player.stats.maxHp, prev.player.stats.hp + heal) } };
            modifiedPrev.messages = [{ text: `Healed ${heal} HP from the spring.`, type: 'success' } as GameMessage, ...prev.messages].slice(0, 50);
            const newMap = [...prev.map];
            newMap[nextPos.y] = [...newMap[nextPos.y]];
            newMap[nextPos.y][nextPos.x] = TileType.FLOOR;
            modifiedPrev.map = newMap;
        }

        return advanceTurnInner(modifiedPrev, nextPos);
    });
  }, []);

  const shootArrow = useCallback((direction: Point) => {
      setGameState(prev => {
          if (!prev || prev.isGameOver) return prev;
          
          // ALWAYS clear aimingDirection to prevent softlock
          let updatedState = { ...prev, aimingDirection: null };
          
          // Use ranged slot first, fallback to current melee weapon if it has range
          const weapon = prev.equipped.ranged || (prev.equipped.weapon?.range ? prev.equipped.weapon : null);
          
          if (!weapon || !weapon.range) {
              updatedState.messages = [{ text: "You have no ranged weapon ready!", type: 'danger' } as GameMessage, ...prev.messages].slice(0, 50);
              return updatedState;
          }

          let targetPos = { ...prev.player.position };
          let hitEnemy = null;
          for (let i = 0; i < (weapon.range || 1); i++) {
              targetPos.x += direction.x;
              targetPos.y += direction.y;
              if (targetPos.x < 0 || targetPos.x >= MAP_WIDTH || targetPos.y < 0 || targetPos.y >= MAP_HEIGHT) break;
              if (prev.map[targetPos.y][targetPos.x] === TileType.WALL) break;
              const enemyIndex = prev.enemies.findIndex(e => e.position.x === targetPos.x && e.position.y === targetPos.y);
              if (enemyIndex !== -1) {
                  hitEnemy = prev.enemies[enemyIndex];
                  break;
              }
          }

          if (hitEnemy) {
              const dmg = Math.max(1, (prev.characterSheet?.modifiers.rangedAttack || 0) + (weapon.stats?.atk || 0) - hitEnemy.stats.def);
              const updatedEnemies = [...prev.enemies];
              const enemyIdx = updatedEnemies.findIndex(e => e.id === hitEnemy!.id);
              updatedEnemies[enemyIdx] = { 
                  ...updatedEnemies[enemyIdx], 
                  stats: { ...updatedEnemies[enemyIdx].stats, hp: updatedEnemies[enemyIdx].stats.hp - dmg } 
              };
              
              updatedState.messages = [{ text: `You loose a shot from your ${weapon.name}! Hit ${hitEnemy.name} for ${dmg} damage.`, type: 'combat' } as GameMessage, ...prev.messages];
              if (updatedEnemies[enemyIdx].stats.hp <= 0) {
                  updatedState.messages.unshift({ text: `The bolt pierces ${hitEnemy.name}'s heart! They fall.`, type: 'success' });
                  updatedEnemies.splice(enemyIdx, 1);
              }
              updatedState.enemies = updatedEnemies;
          } else {
              updatedState.messages = [{ text: `Your shot from the ${weapon.name} clatters against the stone.`, type: 'info' } as GameMessage, ...prev.messages];
          }
          
          return advanceTurnInner(updatedState, prev.player.position);
      });
  }, []);

  const toggleInventory = useCallback(() => {
      setGameState(prev => prev ? ({ ...prev, isInventoryOpen: !prev.isInventoryOpen }) : null);
  }, []);

  const handleItemAction = useCallback((item: Item, action: 'equip' | 'consume' | 'disassemble') => {
      setGameState(prev => {
          if (!prev) return null;
          let updatedInventory = [...prev.inventory];
          let updatedEquipped = { ...prev.equipped };
          let updatedStats = { ...prev.player.stats };
          let updatedMessages = [...prev.messages];
          let updatedLightLevel = prev.lightLevel;
          let updatedTorchTimer = prev.torchTimer;

          if (action === 'equip') {
              if (item.type === 'weapon') {
                  if (item.range && item.range > 1) {
                      updatedEquipped.ranged = item;
                  } else {
                      updatedEquipped.weapon = item;
                  }
              }
              if (item.type === 'armor') updatedEquipped.armor = item;
              updatedMessages.unshift({ text: `Equipped ${item.name}.`, type: 'info' });
          } else if (action === 'consume') {
              if (item.stats?.hp) updatedStats.hp = Math.min(updatedStats.maxHp, updatedStats.hp + item.stats.hp);
              if (item.stats?.intelligence) updatedStats.intelligence += item.stats.intelligence;
              if (item.name === 'Torch') {
                  updatedTorchTimer = 100;
                  updatedLightLevel = 100;
                  updatedMessages.unshift({ text: "You light a torch. The darkness recedes.", type: 'success' });
              }
              updatedInventory = updatedInventory.filter(i => i.id !== item.id);
              if (item.name !== 'Torch') updatedMessages.unshift({ text: `Used ${item.name}.`, type: 'success' });
          } else if (action === 'disassemble') {
              const materials = disassembleItem(item, updatedStats);
              const index = updatedInventory.findIndex(i => i.id === item.id);
              if (index !== -1) {
                  updatedInventory.splice(index, 1);
                  if (materials.length > 0) {
                      updatedInventory.push(...materials);
                      updatedMessages.unshift({ text: `Disassembled ${item.name} into materials.`, type: 'success' });
                  } else {
                      updatedMessages.unshift({ text: `Failed to disassemble ${item.name} (low int).`, type: 'danger' });
                  }
              }
          }

          return {
              ...prev,
              inventory: updatedInventory,
              equipped: updatedEquipped,
              player: { ...prev.player, stats: updatedStats },
              messages: updatedMessages.slice(0, 50),
              lightLevel: updatedLightLevel,
              torchTimer: updatedTorchTimer
          };
      });
  }, []);

  const setAiming = useCallback((dir: Point | null) => {
    setGameState(prev => prev ? ({ ...prev, aimingDirection: dir }) : null);
  }, []);

  const nextFloor = useCallback(() => {
    setGameState(prev => {
        if (!prev) return prev;
        initGame(prev.floor + 1, prev.characterSheet || undefined);
        return prev;
    });
  }, [initGame]);

  const craftTorch = useCallback(() => {
    setGameState(prev => {
        if (!prev) return null;
        const rag = prev.inventory.find(i => i.name === 'Oil-Soaked Rag');
        const wood = prev.inventory.find(i => i.name === 'Wood Scraps');
        if (!rag || !wood) return prev;

        const updatedInventory = prev.inventory.filter(i => i.id !== rag.id && i.id !== wood.id);
        updatedInventory.push({
            id: `torch-${Date.now()}`,
            name: 'Torch',
            type: 'consumable',
            description: 'Light it to see in the dark.',
            rarity: 'common'
        });

        return {
            ...prev,
            inventory: updatedInventory,
            messages: [{ text: "Crafted a torch from wood and oil-soaked rags.", type: 'success' } as GameMessage, ...prev.messages].slice(0, 50)
        };
    });
  }, []);

  const buyItem = useCallback((item: Item) => {
    setGameState(prev => {
        if (!prev || !prev.shopkeeper) return prev;
        const totalScrap = prev.inventory.filter(i => i.name === 'Scrap Metal').length;
        const price = (item.value || 10);
        
        if (totalScrap < price) {
            addMessage(`You need ${price} Scrap Metal to buy this!`, 'danger');
            return prev;
        }

        // Consume scrap
        const updatedInventory = [...prev.inventory];
        let removed = 0;
        for (let i = updatedInventory.length - 1; i >= 0; i--) {
            if (updatedInventory[i].name === 'Scrap Metal' && removed < price) {
                updatedInventory.splice(i, 1);
                removed++;
            }
        }
        
        updatedInventory.push({ ...item, id: `${item.id}-${Date.now()}` });
        const updatedShopInventory = prev.shopkeeper.inventory.filter(i => i.id !== item.id);
        
        return {
            ...prev,
            inventory: updatedInventory,
            shopkeeper: { ...prev.shopkeeper, inventory: updatedShopInventory },
            messages: [{ text: `Bought ${item.name} for ${price} scrap.`, type: 'success' } as GameMessage, ...prev.messages].slice(0, 50)
        };
    });
  }, [addMessage]);

  const attackShopkeeper = useCallback(() => {
      setGameState(prev => {
          if (!prev || !prev.shopkeeper) return prev;
          return {
              ...prev,
              shopOpen: false,
              shopkeeper: { ...prev.shopkeeper, hostile: true },
              messages: [{ text: "The Shopkeeper draws his blade! 'You'll regret that, thief!'", type: 'danger' } as GameMessage, ...prev.messages].slice(0, 50)
          };
      });
  }, []);

  const closeShop = useCallback(() => {
      setGameState(prev => prev ? ({ ...prev, shopOpen: false }) : null);
  }, []);

  return { gameState, movePlayer, initGame, nextFloor, shootArrow, toggleInventory, handleItemAction, setAiming, craftTorch, buyItem, attackShopkeeper, closeShop };
}
