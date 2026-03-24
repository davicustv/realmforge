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
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadCharacters(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCharacters(session.user.id);
      else {
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
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

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
      alert("Error creating character: " + error.message);
    }
  };

  const selectCharacter = (char: any) => {
    setSelectedCharacter(char);
  };

  const deleteCharacter = async (charId: string) => {
    if (!confirm("Delete this character? This action cannot be undone.")) return;

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
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono">
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-10 w-full max-w-md text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-8">REALMFORGE</h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
            className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl mb-6 text-lg"
          >
            Sign in with Discord
          </button>
          <p className="text-amber-400 text-sm">A fantasy grind RPG</p>
        </div>
      </div>
    );
  }

  // Logged in - Character Selection Screen
  if (!selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 font-mono p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-5xl font-bold text-yellow-400">REALMFORGE</h1>
            <button onClick={signOut} className="text-sm underline">Sign Out</button>
          </div>

          <h2 className="text-2xl mb-6">Select Your Character</h2>

          <div className="grid gap-4 mb-8">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => selectCharacter(char)}
                className="bg-black/60 border border-amber-700 hover:border-yellow-500 rounded-2xl p-6 cursor-pointer transition-all flex justify-between items-center"
              >
                <div>
                  <p className="text-xl font-bold">{char.name || `Hero ${char.level}`}</p>
                  <p className="text-sm text-amber-400">Level {char.level} • Gold {char.gold}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                  className="text-red-400 hover:text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {characters.length < 3 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl text-lg"
            >
              Create New Character
            </button>
          )}
        </div>

        {/* Create Character Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-black border border-amber-700 rounded-3xl p-8 w-full max-w-sm">
              <h3 className="text-2xl mb-4">New Character</h3>
              <input
                type="text"
                placeholder="Character Name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                className="w-full p-4 bg-black/50 border border-amber-700 rounded-xl mb-6"
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
                  className="flex-1 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl"
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

  // Main Game Screen (Character Selected)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1208] via-[#2c1b0f] to-[#1c1208] text-amber-200 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between mb-8">
          <h1 className="text-5xl font-bold text-yellow-400">REALMFORGE</h1>
          <button onClick={() => setSelectedCharacter(null)} className="text-sm underline">Change Character</button>
        </div>

        <p className="text-center text-xl mb-8">Playing as <span className="text-yellow-400">{selectedCharacter.name || `Hero ${selectedCharacter.level}`}</span></p>

        {/* TODO: Full game UI will go here next */}
        <div className="text-center py-20 text-amber-400">
          Character loaded successfully!<br />
          Full combat system coming in the next update.
        </div>

        <button 
          onClick={signOut}
          className="mt-12 text-sm underline opacity-60 block mx-auto"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default App;