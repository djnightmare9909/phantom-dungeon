/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { GameState, Point, TileType, Entity, GameMessage, Item, GroundItem, Race, Class } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, INITIAL_PLAYER_STATS, MONSTER_TYPES } from '../constants';
import { generateDungeon } from './dungeonGenerator';
import { computeFOV } from './fovService';
import { getStarterItems, generateDrop, disassembleItem } from './items';

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initGame = useCallback((floor = 1, charData?: { name: string, race: Race, pClass: Class, stats: any }) => {
    const { map, rooms } = generateDungeon();
    const playerPos = rooms[0].center;
    
    if (!charData && floor === 1) {
        setGameState(null);
        return;
    }

    const player: Entity = {
      id: 'player',
      name: charData?.name || 'Hero',
      type: 'player',
      position: playerPos,
      stats: charData?.stats || { ...INITIAL_PLAYER_STATS },
      symbol: '@',
      color: 'text-yellow-400'
    };

    const hasDarkVision = charData?.race === 'Elf' || charData?.race === 'Demon' || charData?.race === 'Dwarf';
    const initialFOV = computeFOV(playerPos, 10, map, !hasDarkVision);
    const starterItems = getStarterItems(charData?.race || 'Human', charData?.pClass || 'Fighter');
    
    setGameState(prev => ({
      player,
      playerRace: charData?.race || prev?.playerRace || 'Human',
      playerClass: charData?.pClass || prev?.playerClass || 'Fighter',
      enemies: [],
      itemsOnGround: [],
      inventory: [...starterItems],
      equipped: {
        weapon: starterItems[0],
        armor: starterItems[1]?.type === 'armor' ? starterItems[1] : null
      },
      map,
      visibleTiles: initialFOV,
      exploredTiles: new Set(initialFOV),
      messages: [{ text: `Welcome to floor ${floor}!`, type: 'info' }],
      floor,
      isGameOver: false,
      aimingDirection: null,
      isInventoryOpen: false,
      isCharacterCreationOpen: floor === 1 && !charData,
      lightLevel: hasDarkVision ? 100 : 20,
      hasDarkVision
    } as GameState));

    // Spawn enemies
    setGameState(prev => {
        if (!prev) return null;
        const enemies: Entity[] = [];
        for (let i = 1; i < rooms.length; i++) {
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
        return { ...prev, enemies };
    });
  }, []);

  const addMessage = useCallback((text: string, type: GameMessage['type'] = 'info') => {
    setGameState(prev => {
        if (!prev) return null;
        const newMessages = [{ text, type }, ...prev.messages].slice(0, 50);
        return { ...prev, messages: newMessages };
    });
  }, []);

  const advanceTurn = useCallback((newPlayerPos: Point) => {
    setGameState(prev => {
      if (!prev || prev.isGameOver) return prev;

      let updatedPlayer = { ...prev.player, position: newPlayerPos };
      let updatedEnemies = [...prev.enemies];
      let updatedMessages = [...prev.messages];
      let updatedGroundItems = [...prev.itemsOnGround];
      let isGameOver = false;

      // Enemy Actions
      updatedEnemies = updatedEnemies.map(enemy => {
        const dist = Math.sqrt(Math.pow(enemy.position.x - newPlayerPos.x, 2) + Math.pow(enemy.position.y - newPlayerPos.y, 2));
        
        if (dist <= 1.5) {
            // Attack player
            const dmg = Math.max(1, enemy.stats.atk - (prev.equipped.armor?.stats?.def || updatedPlayer.stats.def));
            updatedPlayer.stats.hp -= dmg;
            updatedMessages.unshift({ text: `${enemy.name} hits you for ${dmg} damage!`, type: 'danger' });
            if (updatedPlayer.stats.hp <= 0) {
                isGameOver = true;
                updatedMessages.unshift({ text: "YOU HAVE DIED.", type: 'danger' });
            }
            return enemy;
        } else if (dist < 8) {
            // Chase player
            const dx = Math.sign(newPlayerPos.x - enemy.position.x);
            const dy = Math.sign(newPlayerPos.y - enemy.position.y);
            const target = { x: enemy.position.x + dx, y: enemy.position.y + dy };
            
            const isWalkable = prev.map[target.y][target.x] === TileType.FLOOR;
            const isOccupied = updatedEnemies.some(e => e.id !== enemy.id && e.position.x === target.x && e.position.y === target.y) || (target.x === newPlayerPos.x && target.y === newPlayerPos.y);

            if (isWalkable && !isOccupied) {
                return { ...enemy, position: target };
            }
        }
        return enemy;
      });

      // Pick up items (auto-pickup if stepping on them)
      let updatedInventory = [...prev.inventory];
      const itemsAtPos = updatedGroundItems.filter(i => i.position.x === newPlayerPos.x && i.position.y === newPlayerPos.y);
      if (itemsAtPos.length > 0) {
          itemsAtPos.forEach(gi => {
              updatedMessages.unshift({ text: `Picked up ${gi.item.name}.`, type: 'success' });
              updatedInventory.push(gi.item);
          });
          updatedGroundItems = updatedGroundItems.filter(i => !(i.position.x === newPlayerPos.x && i.position.y === newPlayerPos.y));
      }

      // Light depletion
      let updatedLightLevel = prev.hasDarkVision ? 100 : Math.max(0, prev.lightLevel - 0.1);
      
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
        lightLevel: updatedLightLevel
      };
    });
  }, []);

  const movePlayer = useCallback((dir: Point) => {
    setGameState(prev => {
        if (!prev || prev.isGameOver || prev.isInventoryOpen) return prev;

        const nextPos = {
            x: prev.player.position.x + dir.x,
            y: prev.player.position.y + dir.y
        };

        if (nextPos.x < 0 || nextPos.x >= MAP_WIDTH || nextPos.y < 0 || nextPos.y >= MAP_HEIGHT) return prev;
        
        // Interactive tiles
        const tile = prev.map[nextPos.y][nextPos.x];
        if (tile === TileType.WALL) return prev;
        
        if (tile === TileType.CHEST) {
            const updatedMessages = [{ text: "You smash the chest! Found some wood.", type: 'success' } as GameMessage, ...prev.messages].slice(0, 50);
            const updatedInventory = [...prev.inventory, {
                id: `wood-${Date.now()}`,
                name: 'Wood Scraps',
                type: 'material',
                description: 'Useful for crafting torches.',
                rarity: 'common'
            } as Item];
            const updatedMap = [...prev.map];
            updatedMap[nextPos.y] = [...updatedMap[nextPos.y]];
            updatedMap[nextPos.y][nextPos.x] = TileType.FLOOR;
            
            setTimeout(() => advanceTurn(prev.player.position), 0);
            return { ...prev, messages: updatedMessages, inventory: updatedInventory, map: updatedMap };
        }
        if (tile === TileType.OIL_PIT) {
            const rags = prev.inventory.filter(i => i.name === 'Cloth Rags');
            if (rags.length > 0) {
                const updatedMessages = [{ text: "You soak your rags in oil.", type: 'success' } as GameMessage, ...prev.messages].slice(0, 50);
                const updatedInventory = prev.inventory.map(i => i.name === 'Cloth Rags' ? { ...i, name: 'Oil-Soaked Rag', description: 'Combustible rag. Use it to craft a torch.' } : i);
                setTimeout(() => advanceTurn(prev.player.position), 0);
                return { ...prev, messages: updatedMessages, inventory: updatedInventory };
            } else {
                return { ...prev, messages: [{ text: "An oil pit. You need rags to soak up the oil.", type: 'info' } as GameMessage, ...prev.messages].slice(0, 50) };
            }
        }

        // Melee Attack
        const enemyIndex = prev.enemies.findIndex(e => e.position.x === nextPos.x && e.position.y === nextPos.y);
        if (enemyIndex !== -1) {
            const enemy = prev.enemies[enemyIndex];
            const playerAtk = prev.player.stats.atk + (prev.equipped.weapon?.stats?.atk || 0);
            const dmg = Math.max(1, playerAtk - enemy.stats.def);
            
            const updatedEnemies = [...prev.enemies];
            const updatedGroundItems = [...prev.itemsOnGround];
            updatedEnemies[enemyIndex].stats.hp -= dmg;
            
            const updatedMessages: GameMessage[] = [{ text: `You strike ${enemy.name} for ${dmg} damage!`, type: 'combat' }, ...prev.messages];
            
            if (updatedEnemies[enemyIndex].stats.hp <= 0) {
                updatedMessages.unshift({ text: `${enemy.name} dies!`, type: 'success' });
                // Drop items
                const drop = generateDrop();
                if (drop) {
                    updatedGroundItems.push({
                        id: `ground-${Date.now()}`,
                        item: drop,
                        position: { ...enemy.position }
                    });
                    updatedMessages.unshift({ text: `${enemy.name} dropped ${drop.name}.`, type: 'info' });
                }
                updatedEnemies.splice(enemyIndex, 1);
            }

            setTimeout(() => advanceTurn(prev.player.position), 0);
            
            return {
                ...prev,
                enemies: updatedEnemies,
                itemsOnGround: updatedGroundItems,
                messages: updatedMessages.slice(0, 50)
            };
        }

        advanceTurn(nextPos);
        return prev;
    });
  }, [advanceTurn]);

  const shootArrow = useCallback((direction: Point) => {
      setGameState(prev => {
          if (!prev || prev.isGameOver) return prev;

          const weapon = prev.equipped.weapon;
          if (!weapon || !weapon.range) {
              return {
                  ...prev,
                  messages: [{ text: "You don't have a ranged weapon equipped!", type: 'danger' }, ...prev.messages].slice(0, 50)
              };
          }

          let targetPos = { ...prev.player.position };
          let hitEnemy = null;
          const range = weapon.range;

          // Raycast arrow
          for (let i = 0; i < range; i++) {
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

          const updatedMessages = [...prev.messages];
          const updatedEnemies = [...prev.enemies];
          const updatedGroundItems = [...prev.itemsOnGround];

          if (hitEnemy) {
              const dmg = Math.max(1, prev.player.stats.atk + (weapon.stats?.atk || 0) - hitEnemy.stats.def);
              hitEnemy.stats.hp -= dmg;
              updatedMessages.unshift({ text: `Your ${weapon.name} hits ${hitEnemy.name} for ${dmg} damage!`, type: 'combat' });

              if (hitEnemy.stats.hp <= 0) {
                  updatedMessages.unshift({ text: `${hitEnemy.name} dies!`, type: 'success' });
                  const drop = generateDrop();
                  if (drop) {
                      updatedGroundItems.push({
                          id: `ground-${Date.now()}`,
                          item: drop,
                          position: { ...hitEnemy.position }
                      });
                  }
                  const hitIdx = updatedEnemies.findIndex(e => e.id === hitEnemy!.id);
                  updatedEnemies.splice(hitIdx, 1);
              }
          } else {
              updatedMessages.unshift({ text: `Your ${weapon.name} hits nothing.`, type: 'info' });
          }

          setTimeout(() => advanceTurn(prev.player.position), 0);

          return {
              ...prev,
              enemies: updatedEnemies,
              itemsOnGround: updatedGroundItems,
              messages: updatedMessages.slice(0, 50),
              aimingDirection: null
          };
      });
  }, [advanceTurn]);

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

          if (action === 'equip') {
              if (item.type === 'weapon') updatedEquipped.weapon = item;
              if (item.type === 'armor') updatedEquipped.armor = item;
              updatedMessages.unshift({ text: `Equipped ${item.name}.`, type: 'info' });
          } else if (action === 'consume') {
              if (item.stats?.hp) updatedStats.hp = Math.min(updatedStats.maxHp, updatedStats.hp + item.stats.hp);
              if (item.stats?.intelligence) updatedStats.intelligence += item.stats.intelligence;
              if (item.name === 'Torch') {
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
              lightLevel: updatedLightLevel
          };
      });
  }, []);

  const setAiming = useCallback((dir: Point | null) => {
    setGameState(prev => prev ? ({ ...prev, aimingDirection: dir }) : null);
  }, []);

  const nextFloor = useCallback(() => {
    setGameState(prev => {
        if (!prev) return prev;
        const charData = {
            name: prev.player.name,
            race: prev.playerRace,
            pClass: prev.playerClass,
            stats: prev.player.stats
        };
        initGame(prev.floor + 1, charData);
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

  return { gameState, movePlayer, initGame, nextFloor, shootArrow, toggleInventory, handleItemAction, setAiming, craftTorch };
}
