import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting to Realmforge...");

  useEffect(() => {
    const initializePlayer = async () => {
      let id = localStorage.getItem('realmforgePlayerId');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('realmforgePlayerId', id);
      }
      setPlayerId(id);

      // Try to load existing player
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setLevel(Number(data.level));
        setXp(Number(data.xp));
        setGold(Number(data.gold));
        setStatus(`Loaded existing character (Level ${data.level})`);
      } else {
        // Create new player
        const { error: insertError } = await supabase.from('players').insert({
          id,
          realm_id: 'main',
          level: 1,
          xp: 0,
          gold: 0,
          current_hp: 25,
        });

        if (insertError) {
          setStatus(`Error creating character: ${insertError.message}`);
        } else {
          setStatus("New character created successfully! Welcome to Realmforge.");
        }
      }
    };

    initializePlayer();
  }, []);

  const levelUpTest = async () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setXp(0);
    setGold(gold + 50);

    if (playerId) {
      const { error } = await supabase
        .from('players')
        .update({ level: newLevel, xp: 0, gold: gold + 50 })
        .eq('id', playerId);

      if (error) {
        setStatus(`Save failed: ${error.message}`);
      } else {
        setStatus(`Level up saved! Now Level ${newLevel}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 text-amber-100 p-8 font-mono flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-yellow-400 mb-8">REALMFORGE</h1>
      
      <div className="bg-black/60 border border-amber-700 rounded-3xl p-10 max-w-md w-full text-center">
        <p className="text-lg mb-6">{status}</p>

        <div className="space-y-4 text-left mb-8">
          <p>Level: <span className="font-bold text-yellow-400">{level}</span></p>
          <p>Glory: <span className="font-bold">{xp}</span></p>
          <p>Gold: <span className="font-bold text-yellow-400">{gold}</span></p>
        </div>

        <button
          onClick={levelUpTest}
          className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl text-xl transition-all"
        >
          Test Level Up + Save
        </button>

        <p className="text-xs mt-8 opacity-60">
          Check your Supabase Table Editor → players table to see the data
        </p>
      </div>
    </div>
  );
}

export default App;