export type RootStackParamList = {
  Home: undefined;
  NewGame: undefined;
  Game: { resume?: boolean; gameId?: string } | undefined;
  History: undefined;
};
