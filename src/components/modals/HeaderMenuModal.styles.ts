import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 14 },
  menuItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  menuCancel: { color: '#6b7280', fontWeight: '700' },
  menuDanger: { color: '#ef4444', fontWeight: '700' },
});
