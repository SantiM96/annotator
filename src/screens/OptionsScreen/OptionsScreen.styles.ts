import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  labelWrap: { flexShrink: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6b7280' },
  subOptionWrap: {
    borderTopWidth: 1,
    borderTopColor: '#efefef',
    paddingTop: 12,
    gap: 10,
  },
  subOptionTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  optionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  optionBtnActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  optionBtnText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  optionBtnTextActive: { color: '#1d4ed8' },
});
