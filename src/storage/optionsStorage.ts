import AsyncStorage from '@react-native-async-storage/async-storage';

const OPTIONS_KEY = '@annotator:options';

export type AppOptions = {
  sortEnabled: boolean;
  sortDescending: boolean;
  burakoMode: boolean;
};

const DEFAULT_OPTIONS: AppOptions = {
  sortEnabled: false,
  sortDescending: true,
  burakoMode: false,
};

export async function loadAppOptions(): Promise<AppOptions> {
  try {
    const raw = await AsyncStorage.getItem(OPTIONS_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    const parsed = JSON.parse(raw);
    return {
      sortEnabled: !!parsed?.sortEnabled,
      sortDescending:
        typeof parsed?.sortDescending === 'boolean'
          ? parsed.sortDescending
          : true,
      burakoMode:
        typeof parsed?.burakoMode === 'boolean' ? parsed.burakoMode : false,
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

export async function saveAppOptions(options: AppOptions): Promise<void> {
  await AsyncStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
}
