import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');

  // Auth listener
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadCharacters(data.session.user.id);
      }
      setLoading(false);
    };

    checkSession();

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
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    setCharacters(data || []);
  };

  const createCharacter = async () => {
    if (!user || !newCharacterName.trim()) return;

    const { error } = await supabase.from('players').insert({
      user_id: user.id,
      realm_id: 'main',
      name: newCharacterName.trim(),
      level: 1,
      xp: 0,
      gold: 0,
      current_hp: 25,
    });

    if (!error) {
      setNewCharacterName('');
      setShowCreateForm(false);
      loadCharacters(user.id);
    } else {
      alert("Failed to create character: " + error.message);
    }
  };

  const selectCharacter = (char: any) => {
    setSelectedCharacter(char);
  };

  const deleteCharacter = async (charId: string) => {
    if (!confirm("Delete this character permanently?")) return;

    await supabase.from('players').delete().eq('id', charId);
    loadCharacters(user.id);
    if (selectedCharacter?.id === charId) setSelectedCharacter(null);
  };

  const signOut = () => supabase.auth.signOut();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-3xl">Loading Realmforge...</div>;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono p-4">
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-10 w-full max-w-md text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-8">REALMFORGE</h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
            className="w-full py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl text-xl mb-4"
          >
            Sign in with Discord
          </button>
          <p className="text-amber-400 text-sm">A fantasy grind RPG</p>
        </div>
      </div>
    );
  }

  // Character Select Screen
  if (!selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 font-mono p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-5xl font-bold text-yellow-400">REALMFORGE</h1>
            <button onClick={signOut} className="text-sm underline opacity-70">Sign Out</button>
          </div>

          <h2 className="text-3xl mb-8">Select Your Character</h2>

          {characters.length === 0 ? (
            <p className="text-center text-amber-400 py-12">You don't have any characters yet.</p>
          ) : (
            <div className="space-y-4 mb-10">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => selectCharacter(char)}
                  className="bg-black/60 border border-amber-700 hover:border-yellow-400 p-6 rounded-2xl cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <p className="text-2xl font-bold">{char.name || `Adventurer ${char.level}`}</p>
                    <p className="text-amber-400">Level {char.level} • {char.gold} Gold</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                    className="text-red-400 hover:text-red-500 px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {characters.length < 3 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl text-xl"
            >
              Create New Character
            </button>
          )}
        </div>

        {/* Create Character Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-black border border-amber-700 rounded-3xl p-8 w-full max-w-sm">
              <h3 className="text-2xl mb-6">New Character</h3>
              <input
                type="text"
                placeholder="Character Name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                className="w-full p-4 bg-black/50 border border-amber-700 rounded-xl mb-6 text-lg"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-4 border border-amber-700 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  onClick={createCharacter}
                  disabled={!newCharacterName.trim()}
                  className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-black font-bold rounded-2xl"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Game Screen (when a character is selected)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1208] via-[#2c1b0f] to-[#1c1208] text-amber-200 font-mono p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-yellow-400 mb-2">REALMFORGE</h1>
        <p className="mb-8">Playing as <span className="text-yellow-400 font-bold">{selectedCharacter.name || `Adventurer`}</span></p>

        <div className="bg-black/60 border border-amber-700 rounded-3xl p-12">
          <p className="text-2xl mb-8">Full game coming soon...</p>
          <button 
            onClick={() => setSelectedCharacter(null)}
            className="text-amber-400 underline"
          >
            ← Back to Character Select
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;