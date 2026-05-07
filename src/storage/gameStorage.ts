import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'CURRENT_GAME_v1';
const HISTORY_KEY = 'HISTORY_v1';

export type SavedPlayer = { id: string; name: string; score: number; played: boolean; lost: boolean };
export type GameEvent = {
  id: string;
  type: 'score' | 'adjust' | 'undo' | 'reset' | 'lost';
  hand: number;
  playerId: string;
  playerName: string;
  delta: number;
  at: number;
};
export type GameSave = {
  id: string;
  gameName: string;
  hand: number;
  players: SavedPlayer[];
  events: GameEvent[];
  savedAt: number;
};

export async function saveCurrentGame(snapshot: GameSave): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
}

export async function loadCurrentGame(): Promise<GameSave | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    return {
      id: parsed.id || `game-${Date.now()}`,
      gameName: parsed.gameName || 'Untitled game',
      hand: typeof parsed.hand === 'number' ? parsed.hand : 1,
      players: Array.isArray(parsed.players) ? parsed.players : [],
      events: Array.isArray(parsed.events) ? (parsed.events as GameEvent[]) : [],
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export async function clearCurrentGame(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function hasCurrentGame(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  return !!raw;
}

export async function getGameHistory(): Promise<GameSave[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<GameSave>[];
    const history: GameSave[] = (Array.isArray(parsed) ? parsed : []).map(g => ({
      id: g.id || `game-${Date.now()}-${Math.random()}`,
      gameName: g.gameName || 'Untitled game',
      hand: typeof g.hand === 'number' ? g.hand : 1,
      players: Array.isArray(g.players)
        ? g.players.map(p => ({
            id: p.id,
            name: p.name,
            score: typeof p.score === 'number' ? p.score : Number(p.score) || 0,
            played: typeof p.played === 'boolean' ? p.played : false,
            lost: typeof p.lost === 'boolean' ? p.lost : false,
          }))
        : [],
      events: Array.isArray(g.events) ? (g.events as GameEvent[]) : [],
      savedAt: typeof g.savedAt === 'number' ? g.savedAt : Date.now(),
    }));
    return history.sort((a, b) => b.savedAt - a.savedAt);
  } catch (e) {
    return [];
  }
}

export async function getGameFromHistory(id: string): Promise<GameSave | null> {
  const history = await getGameHistory();
  return history.find(g => g.id === id) || null;
}

export async function saveGameToHistory(game: GameSave): Promise<void> {
  const history = await getGameHistory();
  const index = history.findIndex(g => g.id === game.id);
  if (index >= 0) {
    history[index] = game;
  } else {
    history.push(game);
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function deleteGameFromHistory(id: string): Promise<void> {
  const history = await getGameHistory();
  const updatedHistory = history.filter(g => g.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
}
