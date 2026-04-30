/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Heart, Shield, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Skull, Beaker, Package, Zap, Brain, Crosshair, X, Hammer, FlaskConical, ScrollText } from 'lucide-react';
import { useGameLoop } from './services/gameEngine';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, INITIAL_PLAYER_STATS } from './constants';
import { TileType, Item, Race, Class } from './types';

function CharacterCreation({ onComplete }: { onComplete: (data: any) => void }) {
    const [name, setName] = React.useState('Adventurer');
    const [race, setRace] = React.useState<Race>('Human');
    const [pClass, setPClass] = React.useState<Class>('Fighter');
    const [points, setPoints] = React.useState(27);
    const [stats, setStats] = React.useState({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
    });

    const races: Race[] = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
    const classes: Class[] = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

    const adjustStat = (stat: keyof typeof stats, delta: number) => {
        const currentVal = stats[stat];
        const newVal = currentVal + delta;
        if (newVal < 8 || newVal > 15) return;

        const cost = delta > 0 ? (newVal > 13 ? 2 : 1) : (currentVal > 13 ? 2 : 1);
        const newPoints = delta > 0 ? points - cost : points + cost;

        if (newPoints < 0 && delta > 0) return;

        setStats(prev => ({ ...prev, [stat]: newVal }));
        setPoints(newPoints);
    };

    const handleStart = () => {
        const str = stats.strength;
        const dex = stats.dexterity;
        const con = stats.constitution;
        const int = stats.intelligence;
        const wis = stats.wisdom;
        const cha = stats.charisma;

        const modifiers = {
            meleeAttack: Math.floor((str - 10) / 2),
            rangedAttack: Math.floor((dex - 10) / 2),
            defense: Math.floor((dex - 10) / 2),
            spellPower: Math.floor((int - 10) / 2),
            torchCraftBonus: Math.floor((int + wis - 20) / 2),
            disassembleBonus: Math.floor((int - 10) / 2),
        };

        const finalStats = {
            ...INITIAL_PLAYER_STATS,
            ...stats,
            hp: 10 + Math.floor((con - 10) / 2) + 10,
            maxHp: 10 + Math.floor((con - 10) / 2) + 10,
            atk: modifiers.meleeAttack,
            def: modifiers.defense,
        };

        const racialTraits: string[] = [];
        if (['Elf', 'Dwarf', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'].includes(race)) racialTraits.push('darkvision');

        onComplete({ 
            name, 
            race, 
            pClass, 
            stats: finalStats, 
            modifiers, 
            racialTraits, 
            classTraits: [] 
        });
    };

    return (
        <div className="flex items-center justify-center h-screen bg-stone-950 text-white font-mono p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900 p-8 rounded-lg border border-stone-800 shadow-2xl max-w-2xl w-full"
            >
                <h1 className="text-3xl font-black mb-8 text-center bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent italic">CHARACTER ORIGIN</h1>
                
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Name</label>
                            <input 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-800 p-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-48 pr-2 scrollbar-hide">
                            <label className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Race</label>
                            <div className="grid grid-cols-2 gap-2">
                                {races.map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setRace(r)}
                                        className={`p-2 text-xs border transition-all ${race === r ? 'bg-orange-600 border-orange-500 text-white' : 'bg-stone-950 border-stone-800 text-stone-500 hover:bg-stone-900'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-48 pr-2 scrollbar-hide">
                            <label className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Class</label>
                            <div className="grid grid-cols-2 gap-2">
                                {classes.map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setPClass(c)}
                                        className={`p-2 text-xs border transition-all ${pClass === c ? 'bg-blue-600 border-blue-500 text-white' : 'bg-stone-950 border-stone-800 text-stone-500 hover:bg-stone-900'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">Attributes</label>
                            <span className="text-xl font-bold text-orange-500">{points} pts</span>
                        </div>
                        <div className="space-y-3 bg-stone-950 p-4 rounded border border-stone-800">
                            {Object.entries(stats).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-[10px] text-stone-400 uppercase w-20">{key}</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => adjustStat(key as any, -1)} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-xs">-</button>
                                        <span className="text-sm font-bold w-4 text-center">{val}</span>
                                        <button onClick={() => adjustStat(key as any, 1)} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-xs">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-3 bg-stone-900/50 rounded text-[10px] text-stone-500 italic border border-stone-800/50 overflow-y-auto max-h-32">
                            {race === 'Elf' && "• Elves have Dark Vision and start with a Longbow."}
                            {race === 'Dragonborn' && "• Dragonborn have Dark Vision and start with Scale Scraps."}
                            {race === 'Tiefling' && "• Tieflings have Dark Vision and start with an Infernal Primer."}
                            {race === 'Dwarf' && "• Dwarves have Dark Vision and start with a Battle Axe."}
                            {race === 'Half-Orc' && "• Half-Orcs have Dark Vision and start with a Spiked Club."}
                            {pClass === 'Paladin' && "• Paladins start with Holy Mace and Shield."}
                            {pClass === 'Wizard' && "• Wizards start with a Willow Wand and high Int."}
                            {pClass === 'Bard' && "• Bards start with a Slim Rapier and high Cha."}
                            {pClass === 'Barbarian' && "• Barbarians start with a Soldier's blade and high Con."}
                        </div>

                        <button 
                            onClick={handleStart}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-lg shadow-orange-950/20 transform active:scale-[0.98] transition-all"
                        >
                            VENTURE FORTH
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function App() {
  const { gameState, movePlayer, initGame, nextFloor, shootArrow, toggleInventory, handleItemAction, setAiming, craftTorch, buyItem, attackShopkeeper, closeShop } = useGameLoop();
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || gameState.isGameOver) return;
      if (e.key.toLowerCase() === 'i') {
          toggleInventory();
          return;
      }
      if (gameState.isInventoryOpen) return;

      if (e.key === ' ') {
          if (!gameState.aimingDirection) {
            setAiming({ x: 0, y: -1 });
          }
          return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (gameState.aimingDirection) setAiming({ x: 0, y: -1 });
          else movePlayer({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (gameState.aimingDirection) setAiming({ x: 0, y: 1 });
          else movePlayer({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (gameState.aimingDirection) setAiming({ x: -1, y: 0 });
          else movePlayer({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (gameState.aimingDirection) setAiming({ x: 1, y: 0 });
          else movePlayer({ x: 1, y: 0 });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ' && gameState?.aimingDirection) {
            shootArrow(gameState.aimingDirection);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, movePlayer, shootArrow, toggleInventory, setAiming]);

  if (!gameState) {
      return <CharacterCreation onComplete={(data) => initGame(1, data)} />;
  }

  const { player, enemies, map, visibleTiles, exploredTiles, messages, isGameOver, floor, itemsOnGround, inventory, isInventoryOpen, aimingDirection, equipped, lightLevel, hasDarkVision, isCharacterCreationOpen, characterSheet } = gameState;

  const totalMeleeAtk = (characterSheet?.modifiers.meleeAttack || 0) + (equipped.weapon?.stats?.atk || 0);
  const totalRangedAtk = (characterSheet?.modifiers.rangedAttack || 0) + (equipped.ranged?.stats?.atk || 0);
  const totalDef = (equipped.armor?.stats?.def || 0) + (characterSheet?.modifiers.defense || 0);

  if (isCharacterCreationOpen) {
      return <CharacterCreation onComplete={(data) => initGame(1, data)} />;
  }

  // Camera offset calculation
  const offsetX = (MAP_WIDTH / 2 - player.position.x) * TILE_SIZE;
  const offsetY = (MAP_HEIGHT / 2 - player.position.y) * TILE_SIZE;

  return (
    <div className="flex flex-col h-screen bg-stone-950 text-stone-200 font-mono select-none overflow-hidden">
      {/* Header / Stats */}
      <div className="flex items-center justify-between p-4 bg-stone-900 border-b border-stone-800 shadow-lg z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            DUNGEON FLOOR {floor}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <div className="w-32 h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <motion.div 
                    initial={false}
                    animate={{ width: `${(player.stats.hp / player.stats.maxHp) * 100}%` }}
                    className="h-full bg-red-600" 
                />
              </div>
              <span className="text-sm font-bold">{player.stats.hp}/{player.stats.maxHp}</span>
            </div>
            <div className="flex items-center gap-2" title="Melee Attack">
              <Sword className="w-4 h-4 text-orange-400" />
              <span className="text-sm">{totalMeleeAtk}</span>
            </div>
            <div className="flex items-center gap-2" title="Ranged Attack">
              <Crosshair className="w-4 h-4 text-green-400" />
              <span className="text-sm">{totalRangedAtk}</span>
            </div>
            <div className="flex items-center gap-2" title="Defense">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{totalDef}</span>
            </div>
            {aimingDirection && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-600 rounded text-[10px] font-bold text-white animate-pulse">
                    <Crosshair className="w-3 h-3" /> AIMING... WASD to aim, SPACE to fire
                </div>
            )}
            {!hasDarkVision && (
                <div className="flex items-center gap-2" title="Light Level">
                    <Beaker className={`w-4 h-4 ${lightLevel > 50 ? 'text-yellow-400' : 'text-stone-600'}`} />
                    <span className="text-sm">{Math.ceil(lightLevel)}%</span>
                </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => toggleInventory()}
                className={`p-2 rounded-md transition-colors ${isInventoryOpen ? 'bg-orange-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
                title="Inventory (I)"
            >
                <Package className="w-5 h-5" />
            </button>
            <button 
                onClick={() => initGame()}
                className="p-2 rounded-md hover:bg-stone-800 transition-colors text-stone-400"
                title="Reset Game"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Game Map Rendering */}
        <div className="flex-1 relative bg-stone-950 overflow-hidden flex">
            <motion.div 
                animate={{ x: offsetX, y: offsetY }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${MAP_WIDTH}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${MAP_HEIGHT}, ${TILE_SIZE}px)`,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    marginLeft: -(MAP_WIDTH * TILE_SIZE) / 2,
                    marginTop: -(MAP_HEIGHT * TILE_SIZE) / 2,
                }}
                className="shadow-2xl border border-stone-800 bg-black"
            >
                {map.map((row, y) => row.map((tile, x) => {
                    const key = `${x},${y}`;
                    const isVisible = visibleTiles.has(key);
                    const isExplored = exploredTiles.has(key);
                    
                    if (!isExplored) return <div key={key} style={{ width: TILE_SIZE, height: TILE_SIZE }} className="bg-stone-950" />;

                    let tileContent = '';
                    let tileColor = 'text-stone-700';
                    let bgColor = 'bg-stone-950';

                    if (tile === TileType.WALL) {
                        tileContent = '#';
                        tileColor = isVisible ? 'text-stone-400' : 'text-stone-600';
                        bgColor = isVisible ? 'bg-stone-800' : 'bg-stone-900';
                    } else if (tile === TileType.FLOOR) {
                        tileContent = '.';
                        tileColor = isVisible ? 'text-stone-500' : 'text-stone-700';
                        bgColor = isVisible ? 'bg-stone-900' : 'bg-black';
                    } else if (tile === TileType.STAIRS_DOWN) {
                        tileContent = '>';
                        tileColor = isVisible ? 'text-blue-400' : 'text-blue-700';
                        bgColor = isVisible ? 'bg-stone-900' : 'bg-black';
                    } else if (tile === TileType.CHEST) {
                        tileContent = 'C';
                        tileColor = isVisible ? 'text-orange-500' : 'text-orange-900';
                        bgColor = isVisible ? 'bg-stone-800' : 'bg-black';
                    } else if (tile === TileType.OIL_PIT) {
                        tileContent = '💧';
                        tileColor = isVisible ? 'text-stone-400' : 'text-stone-700';
                        bgColor = isVisible ? 'bg-stone-900 flex items-center justify-center p-1' : 'bg-black';
                    } else if (tile === TileType.WATER_PIT) {
                        tileContent = '✧';
                        tileColor = isVisible ? 'text-blue-400' : 'text-blue-800';
                        bgColor = isVisible ? 'bg-blue-950 flex items-center justify-center p-1' : 'bg-black';
                        tileContent = '✨';
                    }

                    // Entities
                    const enemy = isVisible ? enemies.find(e => e.position.x === x && e.position.y === y) : null;
                    const item = isVisible ? itemsOnGround.find(i => i.position.x === x && i.position.y === y) : null;
                    const isPlayer = player.position.x === x && player.position.y === y;
                    const shopkeeper = isVisible && gameState.shopkeeper && gameState.shopkeeper.position.x === x && gameState.shopkeeper.position.y === y ? gameState.shopkeeper : null;

                    // Aiming line
                    let isAiming = false;
                    if (aimingDirection) {
                        for (let i = 1; i < 8; i++) {
                            if (player.position.x + aimingDirection.x * i === x && player.position.y + aimingDirection.y * i === y) {
                                isAiming = true;
                                break;
                            }
                        }
                    }

                    return (
                        <div 
                            key={key} 
                            style={{ width: TILE_SIZE, height: TILE_SIZE }}
                            className={`flex items-center justify-center text-xs overflow-hidden transition-all duration-200 border-[0.5px] border-white/5 ${bgColor} ${isAiming ? 'bg-red-900/30 ring-1 ring-red-500/50 z-20' : ''}`}
                        >
                            {isPlayer ? (
                                <motion.span 
                                  layout 
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  className={`${player.color} font-bold z-10 text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]`}
                                >
                                  {aimingDirection ? <Crosshair className="w-4 h-4 text-red-500 animate-pulse" /> : player.symbol}
                                </motion.span>
                            ) : shopkeeper ? (
                                <span className={`${shopkeeper.hostile ? 'text-red-500 animate-pulse' : 'text-blue-400'} font-bold z-10 text-sm`} title="Merchant">
                                    $
                                </span>
                            ) : enemy ? (
                                <span className={`${enemy.color} font-bold z-10`}>
                                  {enemy.symbol}
                                </span>
                            ) : item ? (
                                <span className="text-yellow-500 font-bold animate-bounce z-10" title={item.item.name}>
                                  ?
                                </span>
                            ) : (
                                <span className={`${tileColor} ${!isVisible ? 'opacity-50' : ''}`}>{tileContent}</span>
                            )}
                        </div>
                    );
                }))}
            </motion.div>

            {isInventoryOpen && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-x-20 inset-y-20 bg-stone-900 border border-stone-800 shadow-2xl z-[60] flex flex-col p-6 rounded-lg backdrop-blur-md"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-stone-100 flex items-center gap-3">
                            <Package className="text-orange-500" /> INVENTORY
                        </h2>
                        <button onClick={() => toggleInventory()} className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-500 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
                        {/* Equipment List */}
                        <div className="flex flex-col min-h-0">
                            <div className="flex justify-between items-center pb-2 border-b border-stone-800 mb-4">
                                <div className="flex gap-4">
                                    <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold">Items</h3>
                                </div>
                                <div className="flex gap-2">
                                    {inventory.some(i => i.name === 'Oil-Soaked Rag') && inventory.some(i => i.name === 'Wood Scraps') && (
                                        <button 
                                            onClick={() => craftTorch()}
                                            className="px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white text-[10px] font-bold rounded"
                                        >
                                            CRAFT TORCH
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3 overflow-y-auto pr-4 scrollbar-hide flex-1">
                                {inventory.length === 0 ? (
                                    <p className="text-stone-600 italic">Your pockets are empty...</p>
                                ) : (
                                    inventory.map((item) => {
                                        const isEquipped = equipped.weapon?.id === item.id || equipped.ranged?.id === item.id || equipped.armor?.id === item.id;
                                        
                                        // Simple comparison logic
                                        let statDiff = 0;
                                        if (item.type === 'weapon') {
                                            const comparisonItem = (item.range && item.range > 1) ? equipped.ranged : equipped.weapon;
                                            if (comparisonItem) {
                                                statDiff = (item.stats?.atk || 0) - (comparisonItem.stats?.atk || 0);
                                            } else {
                                                statDiff = item.stats?.atk || 0;
                                            }
                                        } else if (item.type === 'armor' && equipped.armor) {
                                            statDiff = (item.stats?.def || 0) - (equipped.armor.stats?.def || 0);
                                        }

                                        return (
                                            <div key={item.id} className={`p-4 bg-stone-950 border rounded-lg transition-all group relative overflow-hidden ${isEquipped ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-stone-800 hover:border-stone-600'}`}>
                                                {/* Rarity Glow */}
                                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 opacity-10 ${
                                                    item.rarity === 'legendary' ? 'bg-orange-500' :
                                                    item.rarity === 'epic' ? 'bg-purple-500' :
                                                    item.rarity === 'rare' ? 'bg-blue-500' :
                                                    item.rarity === 'uncommon' ? 'bg-green-500' : 'bg-stone-500'
                                                }`} />

                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        {item.type === 'weapon' && <Sword className="w-4 h-4 text-stone-400" />}
                                                        {item.type === 'armor' && <Shield className="w-4 h-4 text-stone-400" />}
                                                        {item.type === 'consumable' && <FlaskConical className="w-4 h-4 text-stone-400" />}
                                                        {item.type === 'material' && <Hammer className="w-4 h-4 text-stone-400" />}
                                                        {item.type === 'trash' && <Skull className="w-4 h-4 text-stone-400" />}
                                                        <span className={`font-bold tracking-tight ${
                                                            item.rarity === 'legendary' ? 'text-orange-500' :
                                                            item.rarity === 'epic' ? 'text-purple-500' :
                                                            item.rarity === 'rare' ? 'text-blue-500' :
                                                            item.rarity === 'uncommon' ? 'text-green-500' : 'text-stone-100'
                                                        }`}>{item.name}</span>
                                                        
                                                        {statDiff !== 0 && (
                                                            <span className={`text-[10px] font-bold ${statDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                {statDiff > 0 ? `+${statDiff}` : statDiff}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-500 uppercase font-black">{item.rarity}</span>
                                                </div>
                                                <p className="text-xs text-stone-500 mb-4 leading-relaxed italic border-l border-stone-800 pl-2">{item.description}</p>
                                                <div className="flex items-center gap-2 relative z-10">
                                                    {(item.type === 'weapon' || item.type === 'armor') && (
                                                        <button 
                                                            onClick={() => handleItemAction(item, 'equip')}
                                                            className={`px-3 py-1.5 text-[10px] font-black rounded transition-all ${
                                                                isEquipped 
                                                                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                                                                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                                                            }`}
                                                        >
                                                            {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                                                        </button>
                                                    )}
                                                    {item.type === 'consumable' && (
                                                        <button 
                                                            onClick={() => handleItemAction(item, 'consume')}
                                                            className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500 text-green-400 hover:text-white text-[10px] font-black rounded transition-all"
                                                        >
                                                            USE ITEM
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleItemAction(item, 'disassemble')}
                                                        className="px-3 py-1.5 bg-stone-900 border border-stone-800 hover:bg-red-950 hover:border-red-900 hover:text-red-400 text-stone-500 text-[10px] font-black rounded transition-all ml-auto"
                                                    >
                                                        SCRAP
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Equipped & Stats View */}
                        <div className="bg-stone-950 p-6 rounded border border-stone-800 flex flex-col items-center">
                            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-6 w-full text-center">Character Loadout</h3>
                            
                            <div className="flex flex-col items-center gap-8 w-full">
                                <div className="space-y-4 w-full">
                                    <div className={`flex items-center gap-4 p-3 bg-stone-900 rounded border transition-colors ${equipped.weapon ? 'border-orange-500/30' : 'border-stone-800'}`}>
                                        <div className="w-10 h-10 rounded bg-stone-950 flex items-center justify-center border border-stone-800">
                                            <Sword className={`w-5 h-5 ${equipped.weapon ? 'text-orange-500' : 'text-stone-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-500 uppercase">Melee</p>
                                            <p className="font-bold text-stone-200">{equipped.weapon?.name || 'Unarmed'}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-4 p-3 bg-stone-900 rounded border transition-colors ${equipped.ranged ? 'border-green-500/30' : 'border-stone-800'}`}>
                                        <div className="w-10 h-10 rounded bg-stone-950 flex items-center justify-center border border-stone-800">
                                            <Crosshair className={`w-5 h-5 ${equipped.ranged ? 'text-green-500' : 'text-stone-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-500 uppercase">Ranged</p>
                                            <p className="font-bold text-stone-200">{equipped.ranged?.name || 'No Ranged'}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-4 p-3 bg-stone-900 rounded border transition-colors ${equipped.armor ? 'border-blue-500/30' : 'border-stone-800'}`}>
                                        <div className="w-10 h-10 rounded bg-stone-950 flex items-center justify-center border border-stone-800">
                                            <Shield className={`w-5 h-5 ${equipped.armor ? 'text-blue-500' : 'text-stone-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-stone-500 uppercase">Armor</p>
                                            <p className="font-bold text-stone-200">{equipped.armor?.name || 'Clothing'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full border-t border-stone-800 pt-8">
                                    <StatItem icon={<Sword className="w-4 h-4 text-orange-500" />} label="Melee" value={totalMeleeAtk} />
                                    <StatItem icon={<Crosshair className="w-4 h-4 text-green-500" />} label="Ranged" value={totalRangedAtk} />
                                    <StatItem icon={<Shield className="w-4 h-4 text-blue-500" />} label="Def" value={totalDef} />
                                    <StatItem icon={<Beaker className="w-4 h-4 text-red-500" />} label="HP" value={`${player.stats.hp}/${player.stats.maxHp}`} />
                                </div>
                                
                                <div className="w-full space-y-2 mt-4 pt-4 border-t border-stone-800/50">
                                    <h4 className="text-[10px] uppercase text-stone-600 font-bold tracking-tighter">Attributes</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
                                            <div key={attr} className="flex flex-col">
                                                <span className="text-[8px] text-stone-500 uppercase">{attr.slice(0,3)}</span>
                                                <span className="text-xs font-bold text-stone-300">{(player.stats as any)[attr]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {gameState.shopOpen && gameState.shopkeeper && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70]"
                >
                    <div className="bg-stone-900 border border-stone-800 p-8 rounded-lg max-w-xl w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                                <Package /> THE MERCHANT'S REST
                            </h2>
                            <button onClick={() => closeShop()} className="text-stone-500 hover:text-white"><X /></button>
                        </div>
                        
                        <p className="text-sm text-stone-400 mb-6 italic">"Welcome, wanderer. Pieces of scrap for pieces of steel. Or perhaps you're just looking?"</p>
                        
                        <div className="space-y-3 mb-8">
                            {gameState.shopkeeper.inventory.map(item => {
                                const price = item.value || 10;
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800 rounded">
                                        <div>
                                            <p className={`font-bold ${
                                                item.rarity === 'rare' ? 'text-blue-500' :
                                                item.rarity === 'uncommon' ? 'text-green-500' : 'text-stone-200'
                                            }`}>{item.name}</p>
                                            <p className="text-[10px] text-stone-500">{item.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-yellow-500 font-bold">{price} Scrap</span>
                                            <button 
                                                onClick={() => buyItem(item)}
                                                className="px-3 py-1 bg-stone-800 hover:bg-orange-600 rounded text-xs font-bold transition-colors"
                                            >
                                                BUY
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-between">
                            <button 
                                onClick={() => closeShop()}
                                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 rounded text-xs font-bold"
                            >
                                LEAVE
                            </button>
                            <button 
                                onClick={() => attackShopkeeper()}
                                className="px-6 py-2 border border-red-900 text-red-900 hover:bg-red-900 hover:text-white rounded text-xs font-bold transition-all"
                            >
                                ATTACK MERCHANT
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {isGameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                    <Skull className="w-20 h-20 text-red-600 mb-4 animate-bounce" />
                    <h2 className="text-4xl font-black text-red-500 tracking-widest mb-8">GAME OVER</h2>
                    <button 
                        onClick={() => initGame(1)}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xl transform active:scale-95 transition-all"
                    >
                        RETRY CHALLENGE
                    </button>
                </div>
            )}
        </div>

        {/* Sidebar: Log & Controls */}
        <div className="w-80 bg-stone-900 border-l border-stone-800 flex flex-col shadow-xl">
          <div className="p-4 border-b border-stone-800 bg-stone-950/50 flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Battle Log</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div 
                  key={`msg-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm leading-tight border-l-2 pl-3 py-1 ${
                    msg.type === 'danger' ? 'text-red-400 border-red-500' :
                    msg.type === 'combat' ? 'text-orange-300 border-orange-500' :
                    msg.type === 'success' ? 'text-green-400 border-green-500' :
                    'text-stone-400 border-stone-700'
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-stone-950 border-t border-stone-800">
            <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
              <div />
              <ControlButton onClick={() => { if(aimingDirection) setAiming({x:0, y:-1}); else movePlayer({ x: 0, y: -1 }) }}><ChevronUp /></ControlButton>
              <div />
              <ControlButton onClick={() => { if(aimingDirection) setAiming({x:-1, y:0}); else movePlayer({ x: -1, y: 0 }) }}><ChevronLeft /></ControlButton>
              <ControlButton onClick={() => { if(aimingDirection) setAiming({x:0, y:1}); else movePlayer({ x: 0, y: 1 }) }}><ChevronDown /></ControlButton>
              <ControlButton onClick={() => { if(aimingDirection) setAiming({x:1, y:0}); else movePlayer({ x: 1, y: 0 }) }}><ChevronRight /></ControlButton>
            </div>
            <p className="text-[10px] text-stone-600 mt-4 text-center">WASD / Arrow: Move | Space: Aim | I: Inv</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-stone-600 uppercase font-bold">{label}</p>
                <p className="text-sm font-bold text-stone-200">{value}</p>
            </div>
        </div>
    );
}

function ControlButton({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 text-stone-400 shadow-inner active:bg-stone-900 transition-colors"
    >
      {children}
    </button>
  );
}
