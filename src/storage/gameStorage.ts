import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'CURRENT_GAME_v1';

export type SavedPlayer = { id: string; name: string; score: number; played: boolean };
export type GameSave = { gameName: string; hand: number; players: SavedPlayer[]; savedAt: number };

export async function saveCurrentGame(snapshot: GameSave): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
}

export async function loadCurrentGame(): Promise<GameSave | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as GameSave) : null;
}

export async function clearCurrentGame(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function hasCurrentGame(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  // Returns true when a saved game exists.
  return !!raw;
}
