import { StyleSheet } from 'react-native';

export const ROW_HEIGHT = 48;
export const ROW_GAP = 8;

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 28 / 1.6,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listWrap: {
    position: 'relative',
  },
  row: {
    height: ROW_HEIGHT,
    borderWidth: 1,
    borderColor: '#d3dae3',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  rowDealer: {
    borderColor: '#22c55e',
    backgroundColor: '#ecfdf3',
  },
  rowName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rowDealerName: {
    color: '#15803d',
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
  },
  hambCenterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamb: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#111827',
  },
  dealerTag: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 10,
    color: '#9ca3af',
    fontSize: 13,
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnGhostText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dragRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  placeholder: {
    opacity: 0,
  },
});
