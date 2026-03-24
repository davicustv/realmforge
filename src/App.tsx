import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadPlayer(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadPlayer(session.user.id);
      else setPlayer(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPlayer = async (userId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    setPlayer(data);
  };

  const handleEmailAuth = async () => {
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(error ? error.message : "Check your email for confirmation!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "Logged in successfully!");
    }
  };

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
  };

  const createCharacter = async () => {
    if (!user) return;

    const { error } = await supabase.from('players').insert({
      user_id: user.id,
      realm_id: 'main',
      level: 1,
      xp: 0,
      gold: 0,
      current_hp: 25,
    });

    if (!error) {
      loadPlayer(user.id);
    } else {
      setMessage("Error creating character: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-3xl">Loading Realmforge...</div>;
  }

  // Not logged in → Show login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono">
        <div className="bg-black/70 border border-amber-700 rounded-3xl p-10 w-full max-w-md">
          <h1 className="text-5xl font-bold text-yellow-400 text-center mb-8">REALMFORGE</h1>

          <div className="space-y-6">
            <button
              onClick={handleDiscordLogin}
              className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl text-lg transition-all"
            >
              Sign in with Discord
            </button>

            <div className="text-center text-amber-400">— or —</div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-black/50 border border-amber-700 rounded-xl text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black/50 border border-amber-700 rounded-xl text-white"
            />

            <button
              onClick={handleEmailAuth}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-2xl text-lg transition-all"
            >
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>

            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-amber-400 underline text-sm"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>

            {message && <p className="text-center text-sm text-red-400">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Logged in but no character yet
  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 to-amber-900 flex items-center justify-center font-mono">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-yellow-400 mb-6">Welcome to Realmforge</h1>
          <p className="text-xl mb-8">Create your first character to begin your journey.</p>
          <button
            onClick={createCharacter}
            className="px-10 py-5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-2xl rounded-2xl"
          >
            Create Character
          </button>
        </div>
      </div>
    );
  }

  // Main Game Screen (Logged in + has character)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c1208] via-[#2c1b0f] to-[#1c1208] text-amber-200 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-6xl font-bold text-yellow-400 text-center mb-2">REALMFORGE</h1>
        <p className="text-center text-amber-400 mb-8">Welcome back, adventurer</p>

        {/* Add your full game UI here later (stats, HP bars, combat, etc.) */}

        <div className="text-center mt-12">
          <p>Level {player.level} • Gold {player.gold}</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="mt-8 text-sm underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;