import { StyleSheet, Platform } from 'react-native';

export const sharedModalStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnDanger: { backgroundColor: '#ef4444' },
  btnTextDisabled: { color: '#e5e7eb' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  btnGhostText: { color: '#374151' },
});

export const getKeyboardAvoidingViewBehavior = () =>
  Platform.select({
    ios: 'padding' as const,
    android: undefined,
  });
