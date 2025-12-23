import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  loadCurrentGame,
  saveCurrentGame,
  type GameSave,
} from '../storage/gameStorage';

type RootStackParamList = {
  Home: undefined;
  Game: { resume?: boolean } | undefined;
  History: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Player = {
  id: string;
  name: string;
  score: number;
  played: boolean;
  lost: boolean;
};

export default function GameScreen({ navigation, route }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
  const [pointsText, setPointsText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [hand, setHand] = useState(1);
  const [isEditingName, setIsEditingName] = useState(false);
  const [gameName, setGameName] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `Game ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds(),
    )}`;
  });

  // Tracks last delta per player for the current hand.
  const [handDeltas, setHandDeltas] = useState<Record<string, number>>({});

  // Exception modal state (long press).
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const [adjustIndex, setAdjustIndex] = useState<number | null>(null);

  // Header menu (kebab).
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Confirm reset modal.
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Prevent onPress after onLongPress.
  const longPressGuard = useRef(false);

  // QoL: reliable focus for Add Points input.
  const pointsInputRef = useRef<TextInput | null>(null);

  // QoL: triple tap detector.
  const tripleTapRef = useRef<{
    lastPid: string | null;
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ lastPid: null, count: 0, timer: null });

  const canConfirmPlayer = useMemo(
    () => newName.trim().length > 0,
    [newName],
  );

  const canConfirmPoints = useMemo(
    () =>
      pointsText.trim().length > 0 &&
      !Number.isNaN(Number(pointsText)),
    [pointsText],
  );

  const canConfirmAdjust = useMemo(
    () =>
      adjustText.trim().length > 0 &&
      !Number.isNaN(Number(adjustText)),
    [adjustText],
  );

  const canShowUndo = useMemo(() => {
    if (adjustIndex === null) return false;
    return !!players[adjustIndex]?.played;
  }, [adjustIndex, players]);

  // Show footer add-player only when there are players and everyone has score 0.
  const showFooterAddPlayer = useMemo(() => {
    if (players.length === 0) return false;
    return players.every(p => p.score === 0);
  }, [players]);

  const openAddPlayerModal = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsAddPlayerOpen(true);
  }, []);

  const startRenameGame = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsEditingName(true);
  }, []);

  const openConfirmReset = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsConfirmResetOpen(true);
  }, []);

  const performReset = useCallback(() => {
    setPlayers(prev =>
      prev.map(p => ({ ...p, score: 0, played: false })),
    );
    setHand(1);
    setHandDeltas({});
    setIsConfirmResetOpen(false);
  }, []);

  const headerRightNode = useMemo(
    () => (
      <View style={styles.headerRightRow}>
        <Pressable
          onPress={() => setTimeout(() => setIsHeaderMenuOpen(true), 0)}
          style={[styles.kebabBtn, styles.headerBtnMargin]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.kebabText}>⋮</Text>
        </Pressable>
      </View>
    ),
    [],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => headerRightNode,
      title: 'Game',
    });
  }, [navigation, headerRightNode]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (route.params?.resume) {
        const snapshot = await loadCurrentGame();
        if (snapshot && mounted) {
          const restoredPlayers: Player[] = snapshot.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            score: typeof p.score === 'number' ? p.score : Number(p.score) || 0,
            played: typeof p.played === 'boolean' ? p.played : false,
            lost: typeof p.lost === 'boolean' ? p.lost : false,
          }));
          
          setGameName(snapshot.gameName);
          setHand(snapshot.hand);
          setPlayers(restoredPlayers);
          setHandDeltas({});
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [route.params]);

  useEffect(() => {
    const snapshot: GameSave = {
      gameName,
      hand,
      players,
      savedAt: Date.now(),
    };
    if (
      players.length > 0 ||
      hand !== 1 ||
      gameName.startsWith('Game ') === false
    ) {
      saveCurrentGame(snapshot).catch(() => {});
    }
  }, [players, hand, gameName]);

  const confirmAddPlayer = () => {
    if (!canConfirmPlayer) return;
    const p: Player = {
      id: `${Date.now()}-${Math.random()}`,
      name: newName.trim(),
      score: 0,
      played: false,
      lost: false,
    };
    setPlayers(prev => [...prev, p]);
    setIsAddPlayerOpen(false);
    setNewName('');
  };

  const openAddPoints = (index: number) => {
    if (players[index].played) return;
    setSelectedIndex(index);
    setPointsText('');
    setIsAddPointsOpen(true);
  };

  const applyDeltaToPlayer = useCallback((index: number, delta: number) => {
    setPlayers(prev => {
      const copy = [...prev];
      const pid = copy[index].id;

      copy[index] = {
        ...copy[index],
        score: copy[index].score + delta,
        played: true,
      };

      setHandDeltas(d => ({ ...d, [pid]: delta }));

      const allPlayed = copy.length > 0 && copy.every(p => p.played);
      if (allPlayed) {
        copy.forEach(p => (p.played = false));
        setHand(h => h + 1);
        setHandDeltas({});
      }

      return copy;
    });
  }, []);

  const confirmAddPoints = () => {
    if (!canConfirmPoints || selectedIndex === null) return;
    const delta = Number(pointsText);
    applyDeltaToPlayer(selectedIndex, delta);

    setIsAddPointsOpen(false);
    setSelectedIndex(null);
    setPointsText('');
  };

  const addZeroQuick = (index: number) => {
    if (players[index]?.played) return;
    applyDeltaToPlayer(index, 0);
  };

  const openAdjust = (index: number) => {
    setAdjustIndex(index);
    setAdjustText('');
    setIsAdjustOpen(true);
  };

  const confirmAdjust = () => {
    if (!canConfirmAdjust || adjustIndex === null) return;
    const delta = Number(adjustText);
    setPlayers(prev => {
      const copy = [...prev];
      copy[adjustIndex] = {
        ...copy[adjustIndex],
        score: copy[adjustIndex].score + delta,
      };
      return copy;
    });
    setIsAdjustOpen(false);
    setAdjustIndex(null);
    setAdjustText('');
  };

  const undoLastForCurrentHand = () => {
    if (adjustIndex === null) return;
    setPlayers(prev => {
      const copy = [...prev];
      const pid = copy[adjustIndex].id;
      const last = handDeltas[pid] ?? 0;

      copy[adjustIndex] = {
        ...copy[adjustIndex],
        score: copy[adjustIndex].score - last,
        played: false,
      };

      const next = { ...handDeltas };
      delete next[pid];
      setHandDeltas(next);

      return copy;
    });
    setIsAdjustOpen(false);
    setAdjustIndex(null);
    setAdjustText('');
  };

  const renderFooter = () =>
    showFooterAddPlayer ? (
      <View style={styles.footerWrap}>
        <Pressable
          onPress={openAddPlayerModal}
          style={[styles.footerBtn, styles.btnPrimary]}
        >
          <Text style={styles.footerBtnText}>＋ Add player</Text>
        </Pressable>
      </View>
    ) : (
      <View style={{ height: 12 }} />
    );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyHint}>No players yet. Add one!</Text>
      <View style={{ height: 12 }} />
      <Pressable
        onPress={openAddPlayerModal}
        style={[styles.footerBtn, styles.btnPrimary]}
      >
        <Text style={styles.footerBtnText}>＋ Add player</Text>
      </Pressable>
    </View>
  );

  const focusPointsInput = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        pointsInputRef.current?.focus();
      }, 0);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {isEditingName ? (
          <TextInput
            value={gameName}
            onChangeText={setGameName}
            onSubmitEditing={() => setIsEditingName(false)}
            onBlur={() => setIsEditingName(false)}
            autoFocus
            style={styles.gameNameInput}
          />
        ) : (
          <Pressable onPress={() => setIsEditingName(true)}>
            <Text style={styles.gameName}>{gameName}</Text>
          </Pressable>
        )}
        <Text style={styles.handText}>Hand: {hand}</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={players}
        keyExtractor={p => p.id}
        extraData={players.map(p => p.played).join(',')}
        renderItem={({ item, index }) => {
          const clearTripleTapTimer = () => {
            if (tripleTapRef.current.timer) {
              clearTimeout(tripleTapRef.current.timer);
              tripleTapRef.current.timer = null;
            }
          };

          const resetTripleTap = () => {
            tripleTapRef.current.lastPid = null;
            tripleTapRef.current.count = 0;
            clearTripleTapTimer();
          };

          const handlePress = () => {
            if (longPressGuard.current) {
              longPressGuard.current = false;
              return;
            }
            if (item.played) return;

            const pid = item.id;
            const t = tripleTapRef.current;

            if (t.lastPid !== pid) {
              t.lastPid = pid;
              t.count = 0;
            }

            t.count += 1;
            clearTripleTapTimer();

            if (t.count === 3) {
              resetTripleTap();
              addZeroQuick(index);
              return;
            }

            t.timer = setTimeout(() => {
              resetTripleTap();
              openAddPoints(index);
            }, 300);
          };

          const handleLongPress = () => {
            clearTripleTapTimer();

            longPressGuard.current = true;
            openAdjust(index);
            setTimeout(() => {
              longPressGuard.current = false;
            }, 250);
          };

          return (
            <Pressable
              onPress={handlePress}
              onLongPress={handleLongPress}
              delayLongPress={2000}
              android_ripple={{ color: '#00000010' }}
              style={[
                styles.playerItem,
                item.played && styles.playerDisabled,
              ]}
            >
              <View style={styles.leftWrap}>
                <Text style={styles.playerIndex}>{index + 1}.</Text>
                <Text style={styles.playerName}>{item.name}</Text>
              </View>
              <Text style={styles.playerScore}>
                {item.played ? ' ' : ''}
                {item.score}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      <Modal
        visible={isHeaderMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsHeaderMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setIsHeaderMenuOpen(false)}
        />
        <View pointerEvents="box-none" style={styles.menuContainer}>
          <View style={styles.menuCard}>
            <Pressable onPress={openAddPlayerModal} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Add player</Text>
            </Pressable>
            <Pressable onPress={startRenameGame} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Rename game</Text>
            </Pressable>
            <Pressable onPress={openConfirmReset} style={styles.menuItem}>
              <Text style={[styles.menuItemText, styles.menuDanger]}>
                Reset
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsHeaderMenuOpen(false)}
              style={styles.menuItem}
            >
              <Text style={[styles.menuItemText, styles.menuCancel]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isConfirmResetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmResetOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({
            ios: 'padding',
            android: undefined,
          })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset game?</Text>
            <Text style={{ color: '#374151', marginBottom: 10 }}>
              This will set Hand to 1 and all scores to 0.
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setIsConfirmResetOpen(false)}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>
                  Cancel
                </Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                onPress={performReset}
                style={[styles.btn, styles.btnDanger]}
              >
                <Text style={styles.btnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAddPlayerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddPlayerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({
            ios: 'padding',
            android: undefined,
          })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add player</Text>

            <TextInput
              placeholder="Player name"
              placeholderTextColor="#9aa3af"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              style={[styles.input, { marginBottom: 10 }]}
              returnKeyType="done"
              onSubmitEditing={confirmAddPlayer}
            />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setIsAddPlayerOpen(false)}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>
                  Cancel
                </Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                onPress={confirmAddPlayer}
                disabled={!canConfirmPlayer}
                style={[
                  styles.btn,
                  canConfirmPlayer
                    ? styles.btnPrimary
                    : styles.btnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    !canConfirmPlayer && styles.btnTextDisabled,
                  ]}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAdjustOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAdjustOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({
            ios: 'padding',
            android: undefined,
          })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust score</Text>

            <TextInput
              placeholder="Enter a number (e.g., -3 or 5)"
              placeholderTextColor="#9aa3af"
              value={adjustText}
              onChangeText={setAdjustText}
              keyboardType={Platform.select({
                ios: 'numbers-and-punctuation',
                android: 'numeric',
              })}
              autoFocus
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmAdjust}
            />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setIsAdjustOpen(false)}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>
                  Cancel
                </Text>
              </Pressable>

              {canShowUndo && (
                <>
                  <View style={{ width: 10 }} />
                  <Pressable
                    onPress={undoLastForCurrentHand}
                    style={[styles.btn, styles.btnDanger]}
                  >
                    <Text style={styles.btnText}>Undo</Text>
                  </Pressable>
                </>
              )}

              <View style={{ width: 10 }} />
              <Pressable
                onPress={confirmAdjust}
                disabled={!canConfirmAdjust}
                style={[
                  styles.btn,
                  canConfirmAdjust
                    ? styles.btnPrimary
                    : styles.btnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    !canConfirmAdjust && styles.btnTextDisabled,
                  ]}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isAddPointsOpen}
        transparent
        animationType="fade"
        onShow={focusPointsInput}
        onRequestClose={() => setIsAddPointsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({
            ios: 'padding',
            android: undefined,
          })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add points</Text>

            <TextInput
              ref={r => {
                pointsInputRef.current = r;
              }}
              placeholder="e.g. 5  (use -3 to subtract)"
              placeholderTextColor="#9aa3af"
              value={pointsText}
              onChangeText={setPointsText}
              keyboardType={Platform.select({
                ios: 'numbers-and-punctuation',
                android: 'numeric',
              })}
              autoFocus
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmAddPoints}
            />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setIsAddPointsOpen(false)}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>
                  Cancel
                </Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                onPress={confirmAddPoints}
                disabled={!canConfirmPoints}
                style={[
                  styles.btn,
                  canConfirmPoints
                    ? styles.btnPrimary
                    : styles.btnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    !canConfirmPoints && styles.btnTextDisabled,
                  ]}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  gameName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  gameNameInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    minWidth: 150,
  },
  handText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyHint: { textAlign: 'center', color: '#6b7280', marginTop: 8 },
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
  leftWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerIndex: {
    width: 22,
    textAlign: 'right',
    marginRight: 8,
    color: '#6b7280',
  },
  playerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  playerScore: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerRightRow: { flexDirection: 'row' },
  kebabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderRadius: 999,
  },
  kebabText: { fontSize: 22, lineHeight: 22, color: '#111827' },
  headerBtnMargin: { marginRight: 8 },
  footerWrap: { paddingTop: 6, paddingBottom: 24 },
  footerBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
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
  menuBackdrop: { position: 'absolute', inset: 0 },
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
