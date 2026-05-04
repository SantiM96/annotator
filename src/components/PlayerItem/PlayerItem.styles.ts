import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  playerDisabled: { backgroundColor: '#e5e7eb' },
  playerLost: { backgroundColor: '#fee2e2' },
  leftWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerIndex: {
    width: 22,
    textAlign: 'right',
    marginRight: 8,
    color: '#6b7280',
  },
  playerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  playerNameLost: { textDecorationLine: 'line-through', color: '#7f1d1d' },
  lostBadge: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#7f1d1d',
  },
  playerScore: { fontSize: 16, fontWeight: '700', color: '#111827' },
  playerScoreLost: { color: '#7f1d1d' },
});
