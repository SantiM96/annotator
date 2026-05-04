import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  column: { width: 150, gap: 12 },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    width: '100%',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 18, fontWeight: '600' },

  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2563eb',
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#2563eb', fontSize: 18, fontWeight: '700' },

  btnPressed: { opacity: 0.85 },
});
