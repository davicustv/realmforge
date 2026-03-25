import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadCharacters(data.session.user.id);
      }
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCharacters(session.user.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadCharacters = async (userId: string) => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId);
    setCharacters(data || []);
  };

  const signOut = () => supabase.auth.signOut();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-3xl">Loading Realmforge...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono p-4">
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-10 max-w-md w-full text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-8">REALMFORGE - TESTING</h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
            className="w-full py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl text-xl"
          >
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  // Character Select Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold text-yellow-400">REALMFORGE</h1>
          <button onClick={signOut} className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white rounded-xl text-sm">Logout</button>
        </div>

        <h2 className="text-3xl mb-8">Select Your Character</h2>

        {characters.length === 0 && (
          <p className="text-center py-12 text-amber-400 text-lg">You don't have any characters yet.</p>
        )}

        <div className="space-y-4 mb-10">
          {characters.map((char) => (
            <div key={char.id} className="bg-black/60 border border-amber-700 p-6 rounded-2xl">
              <p className="text-2xl font-bold">{char.name || `Hero ${char.level}`}</p>
              <p className="text-amber-400">Level {char.level} • Gold {char.gold}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => alert("Create character form would open here (next step)")}
          className="w-full py-5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-2xl text-xl"
        >
          Create New Character
        </button>
      </div>
    </div>
  );
}

export default App;