import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadCharacters(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCharacters(session.user.id);
      } else {
        setCharacters([]);
        setSelectedCharacter(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadCharacters = async (userId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId);
    setCharacters(data || []);
  };

  const createCharacter = async () => {
    if (!user || !newCharacterName.trim()) return;

    await supabase.from('players').insert({
      user_id: user.id,
      realm_id: 'main',
      name: newCharacterName.trim(),
      level: 1,
      xp: 0,
      gold: 0,
      current_hp: 25,
    });

    setNewCharacterName('');
    setShowCreateForm(false);
    loadCharacters(user.id);
  };

  const selectCharacter = (char: any) => setSelectedCharacter(char);

  const deleteCharacter = async (id: string) => {
    if (!confirm("Delete this character?")) return;
    await supabase.from('players').delete().eq('id', id);
    loadCharacters(user.id);
    if (selectedCharacter?.id === id) setSelectedCharacter(null);
  };

  const signOut = () => supabase.auth.signOut();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-3xl">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono">
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-10 max-w-md w-full text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-8">REALMFORGE</h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
            className="w-full py-5 bg-[#5865F2] hover:bg-[#4752C4] rounded-2xl text-white font-bold text-xl"
          >
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  if (!selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 font-mono p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between mb-10">
            <h1 className="text-5xl font-bold text-yellow-400">REALMFORGE</h1>
            <button onClick={signOut} className="text-sm underline">Sign Out</button>
          </div>

          <h2 className="text-3xl mb-8">Your Characters</h2>

          {characters.length === 0 && (
            <p className="text-center py-12 text-amber-400">You don't have any characters yet.</p>
          )}

          <div className="space-y-4 mb-10">
            {characters.map(char => (
              <div
                key={char.id}
                onClick={() => selectCharacter(char)}
                className="bg-black/60 border border-amber-700 hover:border-yellow-400 p-6 rounded-2xl cursor-pointer flex justify-between"
              >
                <div>
                  <p className="text-2xl font-bold">{char.name || `Hero ${char.level}`}</p>
                  <p className="text-amber-400">Level {char.level} • Gold {char.gold}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                  className="text-red-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl text-xl"
          >
            Create New Character
          </button>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
            <div className="bg-black border border-amber-700 rounded-3xl p-8 w-full max-w-sm">
              <h3 className="text-2xl mb-4">New Character</h3>
              <input
                type="text"
                placeholder="Character Name"
                value={newCharacterName}
                onChange={e => setNewCharacterName(e.target.value)}
                className="w-full p-4 bg-black/50 border border-amber-700 rounded-xl mb-6"
              />
              <div className="flex gap-4">
                <button onClick={() => setShowCreateForm(false)} className="flex-1 py-4 border border-amber-700 rounded-2xl">Cancel</button>
                <button onClick={createCharacter} className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Game (when character is selected)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1208] via-[#2c1b0f] to-[#1c1208] p-8 text-center">
      <h1 className="text-5xl font-bold text-yellow-400 mb-4">REALMFORGE</h1>
      <p className="mb-8">Playing as <span className="text-yellow-400">{selectedCharacter.name}</span></p>
      
      <button 
        onClick={() => setSelectedCharacter(null)}
        className="mt-12 underline text-amber-400"
      >
        ← Back to Character Select
      </button>
    </div>
  );
}

export default App;