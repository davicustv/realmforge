import { useState, useEffect } from 'react';

function App() {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const getPlayerBaseStats = () => ({
    maxHp: 20 + level * 5,
    attack: 5 + level * 2,
    defense: 2 + Math.floor(level / 2),
  });

  const [currentPlayerHp, setCurrentPlayerHp] = useState(0);
  const [enemy, setEnemy] = useState<any>(null);
  const [inCombat, setInCombat] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('realmforgePlayer');
    if (saved) {
      const data = JSON.parse(saved);
      setLevel(data.level || 1);
      setXp(data.xp || 0);
      setGold(data.gold || 0);
      setLog(data.log || []);
      setCurrentPlayerHp(data.currentHp || getPlayerBaseStats().maxHp);
    } else {
      setCurrentPlayerHp(getPlayerBaseStats().maxHp);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('realmforgePlayer', JSON.stringify({
      level, xp, gold, log, currentHp: currentPlayerHp
    }));
  }, [level, xp, gold, log, currentPlayerHp]);

  const startCombat = () => {
    const playerStats = getPlayerBaseStats();
    setCurrentPlayerHp(playerStats.maxHp);

    const foes = [
      { name: 'Goblin Scout', hp: 15 + level * 2, maxHp: 15 + level * 2, attack: 4 + level, defense: 1 },
      { name: 'Ferocious Wolf', hp: 18 + level * 3, maxHp: 18 + level * 3, attack: 6 + level, defense: 2 },
      { name: 'Bandit Thug', hp: 25 + level * 4, maxHp: 25 + level * 4, attack: 5 + level * 2, defense: 3 },
      { name: 'Shadow Wraith', hp: 30 + level * 5, maxHp: 30 + level * 5, attack: 8 + level, defense: 1 },
    ];
    const foe = foes[Math.floor(Math.random() * foes.length)];

    setEnemy({ ...foe, hp: foe.maxHp });
    setInCombat(true);
    setPlayerTurn(true);
    setLog(prev => [`The battle begins! A ${foe.name} lunges from the shadows.`, ...prev.slice(0, 5)]);
  };

  const rest = () => {
    if (inCombat) return;
    const cost = 10 + level * 2;
    if (gold < cost) {
      setLog(prev => [`You search for a safe place to rest, but your purse is too light (${cost} gold needed).`, ...prev.slice(0, 5)]);
      return;
    }
    setGold(g => g - cost);
    const playerStats = getPlayerBaseStats();
    setCurrentPlayerHp(playerStats.maxHp);
    setLog(prev => [`You rest at a quiet glade. Wounds knit under moonlight. Full health restored. (${cost} gold spent)`, ...prev.slice(0, 5)]);
  };

  const playerAction = (action: string) => {
    if (!playerTurn || !inCombat || !enemy) return;

    const playerStats = getPlayerBaseStats();

    if (action === 'attack') {
      const damage = Math.max(1, Math.floor(Math.random() * playerStats.attack) - enemy.defense);
      const newEnemyHp = Math.max(0, enemy.hp - damage);
      setEnemy({ ...enemy, hp: newEnemyHp });

      setLog(prev => [`You strike the ${enemy.name} for ${damage} damage!`, ...prev.slice(0, 11)]);

      if (newEnemyHp <= 0) {
        const gainXp = Math.floor(enemy.maxHp / 2) + level * 5;
        const gainGold = Math.floor(Math.random() * 20) + 10;

        setLog(prev => [
          `Victory! The ${enemy.name} falls.`,
          `Gained ${gainXp} glory and ${gainGold} gold coins.`,
          ...prev.slice(0, 9)
        ]);

        setXp(prevXp => {
          let newXp = prevXp + gainXp;
          if (newXp >= level * 100) {
            const overflow = newXp - level * 100;
            setLevel(l => l + 1);
            setLog(prevLog => [`[ASCENSION] Your legend grows! Level ${level + 1}!`, ...prevLog.slice(0, 8)]);
            return overflow;
          }
          return newXp;
        });
        setGold(g => g + gainGold);
        setInCombat(false);
        setEnemy(null);
        return;
      }
    } else if (action === 'defend') {
      setLog(prev => ['You raise your shield, bracing for the next blow.', ...prev.slice(0, 11)]);
    } else if (action === 'flee') {
      if (Math.random() > 0.4) {
        setLog(prev => ['You escape into the mist!', ...prev.slice(0, 11)]);
        setInCombat(false);
        setEnemy(null);
        return;
      } else {
        setLog(prev => ['The foe blocks your retreat!', ...prev.slice(0, 11)]);
      }
    }

    setPlayerTurn(false);
    setTimeout(enemyTurn, 800);
  };

  const enemyTurn = () => {
    if (!inCombat || !enemy) return;

    const playerStats = getPlayerBaseStats();
    const damage = Math.max(1, Math.floor(Math.random() * enemy.attack) - playerStats.defense);
    const newHp = Math.max(0, currentPlayerHp - damage);
    setCurrentPlayerHp(newHp);

    setLog(prev => [
      `The ${enemy.name} strikes you for ${damage} damage!`,
      newHp <= 0 ? 'Defeat... You fall to the shadows. (Some gold lost.)' : 'You endure.',
      ...prev.slice(0, 10)
    ]);

    if (newHp <= 0) {
      setGold(g => Math.max(0, g - 15));
      setInCombat(false);
      setEnemy(null);
    } else {
      setPlayerTurn(true);
    }
  };

  const playerStats = getPlayerBaseStats();
  const playerHpPercent = Math.max(0, (currentPlayerHp / playerStats.maxHp) * 100);

  const getHpColor = (percent: number) => {
    if (percent > 70) return 'bg-green-500';
    if (percent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1208] via-[#2c1b0f] to-[#1c1208] text-amber-200 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-6xl font-bold text-yellow-400 tracking-widest drop-shadow-xl">REALMFORGE</h1>
          <p className="text-amber-400 mt-2 text-lg">Forge your legend through endless battle</p>
        </header>

        {/* Stats */}
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-amber-400">Level</span>
              <span className="ml-3 text-2xl font-bold text-yellow-400">{level}</span>
            </div>
            <div>
              <span className="text-amber-400">Glory</span>
              <span className="ml-3 text-2xl font-bold">{xp} / {level * 100}</span>
            </div>
            <div>
              <span className="text-amber-400">Gold</span>
              <span className="ml-3 text-2xl font-bold text-yellow-400">{gold}</span>
            </div>
          </div>

          {/* Player HP Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Your Vitality</span>
              <span>{currentPlayerHp} / {playerStats.maxHp}</span>
            </div>
            <div className="h-4 bg-gray-900 rounded-full border border-amber-600 overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out ${getHpColor(playerHpPercent)}`}
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
          </div>

          {/* Enemy HP Bar */}
          {inCombat && enemy && (
            <div>
              <div className="flex justify-between text-sm mb-1 text-red-300">
                <span>{enemy.name}</span>
                <span>{enemy.hp} / {enemy.maxHp}</span>
              </div>
              <div className="h-4 bg-gray-900 rounded-full border border-red-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${getHpColor((enemy.hp / enemy.maxHp) * 100)}`}
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!inCombat ? (
          <div className="flex flex-col gap-4 mb-10">
            <button
              onClick={startCombat}
              className="w-full py-6 bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-600 hover:to-yellow-600 text-2xl font-bold rounded-2xl shadow-xl hover:shadow-yellow-500/40 transition-all active:scale-95"
            >
              EMBARK ON QUEST
            </button>
            <button
              onClick={rest}
              className="w-full py-4 bg-gradient-to-r from-indigo-800 to-purple-800 hover:from-indigo-700 hover:to-purple-700 text-xl font-bold rounded-2xl shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              REST AT THE GLADE ({10 + level * 2} gold)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <button
              onClick={() => playerAction('attack')}
              disabled={!playerTurn}
              className={`py-6 text-xl font-bold rounded-2xl transition-all ${playerTurn ? 'bg-red-900 hover:bg-red-700 active:bg-red-800' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              ATTACK
            </button>
            <button
              onClick={() => playerAction('defend')}
              disabled={!playerTurn}
              className={`py-6 text-xl font-bold rounded-2xl transition-all ${playerTurn ? 'bg-blue-900 hover:bg-blue-700 active:bg-blue-800' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              DEFEND
            </button>
            <button
              onClick={() => playerAction('flee')}
              disabled={!playerTurn}
              className={`py-6 text-xl font-bold rounded-2xl transition-all ${playerTurn ? 'bg-purple-900 hover:bg-purple-700 active:bg-purple-800' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              FLEE
            </button>
          </div>
        )}

        {/* Combat Log */}
        <div className="bg-black/70 border border-amber-800 rounded-3xl p-6 h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-700">
          {log.length === 0 ? (
            <p className="text-center py-16 text-amber-400/60 italic">The ancient tome awaits your first legend...</p>
          ) : (
            log.map((line, i) => (
              <p
                key={i}
                className={`mb-3 leading-relaxed ${line.includes('ASCENSION') || line.includes('Victory') ? 'text-yellow-300 font-bold text-lg' : ''} ${line.includes('strike') && line.includes('You') ? 'text-green-400' : ''} ${line.includes('strikes you') ? 'text-red-400' : ''} ${line.includes('Defeat') ? 'text-red-500 font-bold' : ''} ${line.includes('rest') ? 'text-cyan-300' : ''}`}
              >
                {line}
              </p>
            ))
          )}
        </div>

        <footer className="text-center text-xs mt-8 opacity-50">
          Realmforge — An endless fantasy grind
        </footer>
      </div>
    </div>
  );
}

export default App;