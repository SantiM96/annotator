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
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
  Platform,
  UIManager,
} from 'react-native';
import { styles } from './GameScreen.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getGameFromHistory,
  loadCurrentGame,
  saveCurrentGame,
  saveGameToHistory,
  type GameEvent,
  type GameSave,
} from '../../storage/gameStorage';
import { loadAppOptions, type AppOptions } from '../../storage/optionsStorage';

import { Player, PlayerItem } from '../../components/PlayerItem/PlayerItem';
import { HeaderMenuModal } from '../../components/modals/HeaderMenuModal';
import { ConfirmRemovePlayerModal } from '../../components/modals/ConfirmRemovePlayerModal';
import { ConfirmResetModal } from '../../components/modals/ConfirmResetModal';
import { AddPlayerModal } from '../../components/modals/AddPlayerModal';
import { AdjustScoreModal } from '../../components/modals/AdjustScoreModal';
import { AddPointsModal } from '../../components/modals/AddPointsModal';
import { ReorderDealersModal } from '../../components/modals/ReorderDealersModal';

type RootStackParamList = {
  Home: undefined;
  Game: { resume?: boolean; gameId?: string } | undefined;
  History: undefined;
  Options: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  const [gameId, setGameId] = useState(() => `game-${Date.now()}`);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [displayPlayers, setDisplayPlayers] = useState<Player[]>([]);
  const [dealerOrder, setDealerOrder] = useState<string[]>([]);
  const [currentDealerId, setCurrentDealerId] = useState<string | null>(null);
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
    )}`;
  });

  const [handDeltas, setHandDeltas] = useState<Record<string, number>>({});
  const [appOptions, setAppOptions] = useState<AppOptions>({
    sortEnabled: false,
    sortDescending: true,
    burakoMode: false,
  });

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const [adjustIndex, setAdjustIndex] = useState<number | null>(null);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isReorderDealersOpen, setIsReorderDealersOpen] = useState(false);

  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const [isLostMode, setIsLostMode] = useState(false);
  const [expandedHistoryPlayerId, setExpandedHistoryPlayerId] = useState<string | null>(null);

  const pointsInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const canConfirmPlayer = useMemo(() => newName.trim().length > 0, [newName]);

  const canConfirmPoints = useMemo(
    () => pointsText.trim().length > 0 && !Number.isNaN(Number(pointsText)),
    [pointsText],
  );

  const canConfirmAdjust = useMemo(
    () => adjustText.trim().length > 0 && !Number.isNaN(Number(adjustText)),
    [adjustText],
  );

  const canShowUndo = useMemo(() => {
    if (adjustIndex === null) return false;
    return !!players[adjustIndex]?.played;
  }, [adjustIndex, players]);

  const showFooterAddPlayer = useMemo(() => {
    if (players.length === 0) return false;
    return players.every(p => p.score === 0);
  }, [players]);

  const getNormalizedDealerOrder = useCallback(
    (sourceOrder: string[], sourcePlayers: Player[]) => {
      const valid = new Set(sourcePlayers.map(p => p.id));
      const kept = sourceOrder.filter(id => valid.has(id));
      const missing = sourcePlayers.map(p => p.id).filter(id => !kept.includes(id));
      return [...kept, ...missing];
    },
    [],
  );

  const getNextDealerAfterRound = useCallback(
    (
      sourcePlayers: Player[],
      sourceOrder: string[],
      sourceCurrentDealerId: string | null,
    ) => {
      const normalized = getNormalizedDealerOrder(sourceOrder, sourcePlayers);
      if (normalized.length === 0) {
        return { order: normalized, dealerId: null as string | null };
      }
      const current = sourceCurrentDealerId ?? normalized[0];
      const currentIndex = normalized.indexOf(current);
      const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeCurrentIndex + 1) % normalized.length;
      const nextCandidateId = normalized[nextIndex];
      const nextCandidate = sourcePlayers.find(p => p.id === nextCandidateId);
      const nextDealerId = nextCandidate?.lost ? current : nextCandidateId;
      return { order: normalized, dealerId: nextDealerId };
    },
    [getNormalizedDealerOrder],
  );

  const sortPlayersByOptions = useCallback(
    (sourcePlayers: Player[], options: AppOptions) => {
      if (!options.sortEnabled) return sourcePlayers;
      const originalIndexById = new Map(
        sourcePlayers.map((p, idx) => [p.id, idx] as const),
      );
      const sorted = [...sourcePlayers].sort((a, b) => {
        const scoreCmp = options.sortDescending
          ? b.score - a.score
          : a.score - b.score;
        if (scoreCmp !== 0) return scoreCmp;
        return (
          (originalIndexById.get(a.id) ?? 0) -
          (originalIndexById.get(b.id) ?? 0)
        );
      });
      return sorted;
    },
    [],
  );

  const reorderAnimValuesRef = useRef<Record<string, Animated.Value>>({});
  const prevDisplayPlayersRef = useRef<Player[]>([]);
  const ROW_ESTIMATED_HEIGHT = 86;

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

  const openReorderDealers = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsReorderDealersOpen(true);
  }, []);

  const openOptions = useCallback(() => {
    setIsHeaderMenuOpen(false);
    navigation.navigate('Options');
  }, [navigation]);

  const performReset = useCallback(() => {
    const nextGameId = `game-${Date.now()}`;
    setGameId(nextGameId);
    setPlayers(prev =>
      prev.map(p => ({ ...p, score: 0, played: false, lost: false })),
    );
    setEvents([]);
    setHand(1);
    setHandDeltas({});
    setIsConfirmResetOpen(false);
  }, []);

  const exitModes = useCallback(() => {
    setIsLostMode(false);
    setIsRemoveMode(false);
  }, []);

  const toggleLostMode = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsLostMode(v => {
      const next = !v;
      if (next) setIsRemoveMode(false);
      return next;
    });
  }, []);

  const toggleRemoveMode = useCallback(() => {
    setIsHeaderMenuOpen(false);
    setIsRemoveMode(v => {
      const next = !v;
      if (next) setIsLostMode(false);
      return next;
    });
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
    const loadOptions = async () => {
      const nextOptions = await loadAppOptions();
      setAppOptions(nextOptions);
      setPlayers(prev => sortPlayersByOptions(prev, nextOptions));
    };
    loadOptions();
    const unsubscribe = navigation.addListener('focus', loadOptions);
    return unsubscribe;
  }, [navigation, sortPlayersByOptions]);

  useEffect(() => {
    const previousPlayers = prevDisplayPlayersRef.current;
    if (previousPlayers.length === 0) {
      setDisplayPlayers(players);
      prevDisplayPlayersRef.current = players;
      return;
    }

    const oldIndexById = new Map(
      previousPlayers.map((p, i) => [p.id, i] as const),
    );
    const nextValues: Record<string, Animated.Value> = {};

    players.forEach((p, newIndex) => {
      const oldIndex = oldIndexById.get(p.id);
      const deltaRows = oldIndex === undefined ? 0 : oldIndex - newIndex;
      const initialOffset = deltaRows * ROW_ESTIMATED_HEIGHT;
      nextValues[p.id] = new Animated.Value(initialOffset);
    });

    reorderAnimValuesRef.current = nextValues;
    setDisplayPlayers(players);
    prevDisplayPlayersRef.current = players;

    requestAnimationFrame(() => {
      const anims = Object.values(nextValues).map(v =>
        Animated.timing(v, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      );
      Animated.parallel(anims).start();
    });
  }, [players]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (route.params?.resume) {
        const snapshot = route.params.gameId
          ? await getGameFromHistory(route.params.gameId)
          : await loadCurrentGame();
        if (snapshot && mounted) {
          const restoredPlayers: Player[] = snapshot.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            score: typeof p.score === 'number' ? p.score : Number(p.score) || 0,
            played: typeof p.played === 'boolean' ? p.played : false,
            lost: typeof p.lost === 'boolean' ? p.lost : false,
          }));

          setGameId(snapshot.id || `game-${Date.now()}`);
          setGameName(snapshot.gameName);
          setHand(snapshot.hand);
          setPlayers(restoredPlayers);
          setEvents(Array.isArray(snapshot.events) ? snapshot.events : []);
          const restoredDealerOrder = getNormalizedDealerOrder(
            Array.isArray(snapshot.dealerOrder) ? snapshot.dealerOrder : [],
            restoredPlayers,
          );
          setDealerOrder(restoredDealerOrder);
          const restoredDealerId =
            snapshot.currentDealerId &&
            restoredDealerOrder.includes(snapshot.currentDealerId)
              ? snapshot.currentDealerId
              : restoredDealerOrder[0] ?? null;
          setCurrentDealerId(restoredDealerId);
          setHandDeltas({});
          saveCurrentGame(snapshot).catch(() => {});
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [route.params, getNormalizedDealerOrder]);

  useEffect(() => {
    const snapshot: GameSave = {
      id: gameId,
      gameName,
      hand,
      players,
      events,
      dealerOrder,
      currentDealerId,
      savedAt: Date.now(),
    };
    if (
      players.length > 0 ||
      hand !== 1 ||
      gameName.startsWith('Game ') === false
    ) {
      saveCurrentGame(snapshot).catch(() => {});
      saveGameToHistory(snapshot).catch(() => {});
    }
  }, [players, hand, gameName, gameId, events, dealerOrder, currentDealerId]);

  useEffect(() => {
    setDealerOrder(prev => {
      const next = getNormalizedDealerOrder(prev, players);
      if (next.join(',') === prev.join(',')) return prev;
      return next;
    });
    setCurrentDealerId(prev => {
      if (players.length === 0) return null;
      const playerIds = new Set(players.map(p => p.id));
      if (prev && playerIds.has(prev)) return prev;
      const normalized = getNormalizedDealerOrder(dealerOrder, players);
      return normalized[0] ?? players[0]?.id ?? null;
    });
  }, [players, dealerOrder, getNormalizedDealerOrder]);

  const pushEvent = useCallback((event: Omit<GameEvent, 'id' | 'at'>) => {
    setEvents(prev => [
      ...prev,
      {
        ...event,
        id: `${Date.now()}-${Math.random()}`,
        at: Date.now(),
      },
    ]);
  }, []);

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

  const openAddPoints = useCallback((index: number) => {
    const tappedPlayerId = players[index]?.id;
    if (expandedHistoryPlayerId && expandedHistoryPlayerId !== tappedPlayerId) {
      setExpandedHistoryPlayerId(null);
    }
    if (players[index].played) return;
    if (players[index].lost) return;
    setSelectedIndex(index);
    setPointsText('');
    setIsAddPointsOpen(true);
  }, [players, expandedHistoryPlayerId]);

  const applyDeltaToPlayer = useCallback((index: number, delta: number) => {
    setPlayers(prev => {
      const copy = [...prev];
      const pid = copy[index].id;

      if (copy[index].lost) return copy;

      copy[index] = {
        ...copy[index],
        score: copy[index].score + delta,
        played: true,
      };
      pushEvent({
        type: 'score',
        hand,
        playerId: copy[index].id,
        playerName: copy[index].name,
        delta,
      });

      setHandDeltas(d => ({ ...d, [pid]: delta }));

      const activePlayers = copy.filter(p => !p.lost);
      const allActivePlayed =
        activePlayers.length > 0 && activePlayers.every(p => p.played);

      if (allActivePlayed) {
        copy.forEach(p => {
          if (!p.lost) p.played = false;
        });
        const sortedCopy = sortPlayersByOptions(copy, appOptions);
        const nextDealer = getNextDealerAfterRound(copy, dealerOrder, currentDealerId);
        setDealerOrder(nextDealer.order);
        setCurrentDealerId(nextDealer.dealerId);
        setHand(h => h + 1);
        setHandDeltas({});
        return sortedCopy;
      }

      return copy;
    });
  }, [
    hand,
    pushEvent,
    getNextDealerAfterRound,
    dealerOrder,
    currentDealerId,
    appOptions,
    sortPlayersByOptions,
  ]);

  useEffect(() => {
    if (!appOptions.burakoMode) return;
    if (players.length < 2) return;

    const activePlayers = players.filter(p => !p.lost);
    if (activePlayers.length < 2) return;

    const unplayedActive = activePlayers.filter(p => !p.played);
    if (unplayedActive.length !== 1) return;

    const hasAnyAssignedThisRound = activePlayers.some(
      p => p.played || typeof handDeltas[p.id] === 'number',
    );
    if (!hasAnyAssignedThisRound) return;

    const target = unplayedActive[0];
    const targetIndex = players.findIndex(p => p.id === target.id);
    if (targetIndex < 0) return;

    const sumOthers = activePlayers
      .filter(p => p.id !== target.id)
      .reduce((acc, p) => acc + (handDeltas[p.id] ?? 0), 0);

    applyDeltaToPlayer(targetIndex, -sumOthers);
  }, [appOptions.burakoMode, players, handDeltas, applyDeltaToPlayer]);

  const confirmAddPoints = () => {
    if (!canConfirmPoints || selectedIndex === null) return;
    const delta = Number(pointsText);
    applyDeltaToPlayer(selectedIndex, delta);

    setIsAddPointsOpen(false);
    setSelectedIndex(null);
    setPointsText('');
  };

  const addZeroQuick = useCallback((index: number) => {
    const tappedPlayerId = players[index]?.id;
    if (expandedHistoryPlayerId && expandedHistoryPlayerId !== tappedPlayerId) {
      setExpandedHistoryPlayerId(null);
    }
    if (players[index]?.played) return;
    if (players[index]?.lost) return;
    applyDeltaToPlayer(index, 0);
  }, [players, applyDeltaToPlayer, expandedHistoryPlayerId]);

  const toggleLostForPlayer = useCallback((index: number) => {
    setPlayers(prev => {
      const copy = [...prev];
      const nextLost = !copy[index].lost;
      const pid = copy[index].id;

      copy[index] = {
        ...copy[index],
        lost: nextLost,
        played: nextLost ? true : false,
      };

      if (nextLost) {
        pushEvent({
          type: 'lost',
          hand,
          playerId: copy[index].id,
          playerName: copy[index].name,
          delta: 0,
        });
      }

      if (nextLost) {
        setHandDeltas(d => {
          const next = { ...d };
          delete next[pid];
          return next;
        });
      }

      const activePlayers = copy.filter(p => !p.lost);
      const allActivePlayed =
        activePlayers.length > 0 && activePlayers.every(p => p.played);

      if (allActivePlayed) {
        copy.forEach(p => {
          if (!p.lost) p.played = false;
        });
        const sortedCopy = sortPlayersByOptions(copy, appOptions);
        const nextDealer = getNextDealerAfterRound(copy, dealerOrder, currentDealerId);
        setDealerOrder(nextDealer.order);
        setCurrentDealerId(nextDealer.dealerId);
        setHand(h => h + 1);
        setHandDeltas({});
        return sortedCopy;
      }

      return copy;
    });
  }, [
    hand,
    pushEvent,
    getNextDealerAfterRound,
    dealerOrder,
    currentDealerId,
    appOptions,
    sortPlayersByOptions,
  ]);

  const askRemovePlayer = useCallback((index: number) => {
    setRemoveIndex(index);
    setIsConfirmRemoveOpen(true);
  }, []);

  const confirmRemovePlayer = () => {
    if (removeIndex === null) return;

    setPlayers(prev => {
      const copy = [...prev];
      const pid = copy[removeIndex]?.id;

      copy.splice(removeIndex, 1);

      if (pid) {
        setHandDeltas(d => {
          const next = { ...d };
          delete next[pid];
          return next;
        });
      }

      const activePlayers = copy.filter(p => !p.lost);
      const allActivePlayed =
        activePlayers.length > 0 && activePlayers.every(p => p.played);

      if (allActivePlayed) {
        copy.forEach(p => {
          if (!p.lost) p.played = false;
        });
        const sortedCopy = sortPlayersByOptions(copy, appOptions);
        const nextDealer = getNextDealerAfterRound(copy, dealerOrder, currentDealerId);
        setDealerOrder(nextDealer.order);
        setCurrentDealerId(nextDealer.dealerId);
        setHand(h => h + 1);
        setHandDeltas({});
        return sortedCopy;
      }

      return copy;
    });

    setIsConfirmRemoveOpen(false);
    setRemoveIndex(null);
  };

  const openAdjust = useCallback((index: number) => {
    setAdjustIndex(index);
    setAdjustText('');
    setIsAdjustOpen(true);
  }, []);

  const confirmAdjust = () => {
    if (!canConfirmAdjust || adjustIndex === null) return;
    const delta = Number(adjustText);
    setPlayers(prev => {
      const copy = [...prev];
      copy[adjustIndex] = {
        ...copy[adjustIndex],
        score: copy[adjustIndex].score + delta,
      };
      pushEvent({
        type: 'adjust',
        hand,
        playerId: copy[adjustIndex].id,
        playerName: copy[adjustIndex].name,
        delta,
      });
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
      pushEvent({
        type: 'undo',
        hand,
        playerId: copy[adjustIndex].id,
        playerName: copy[adjustIndex].name,
        delta: -last,
      });

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
        {expandedHistoryPlayerId !== null && (
          <Pressable
            onPress={() => setExpandedHistoryPlayerId(null)}
            style={{ height: 220 }}
          />
        )}
      </View>
    ) : (
      <Pressable
        onPress={() => setExpandedHistoryPlayerId(null)}
        style={{ height: expandedHistoryPlayerId !== null ? 220 : 12 }}
      />
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
    Keyboard.dismiss();

    requestAnimationFrame(() => {
      setTimeout(() => {
        pointsInputRef.current?.setNativeProps?.({
          showSoftInputOnFocus: true,
        });
        pointsInputRef.current?.focus();
      }, 50);
    });
  };

  const openPlayerHistory = useCallback((index: number, direction: 'down' | 'up') => {
    const pid = players[index]?.id;
    if (!pid) return;
    setExpandedHistoryPlayerId(prev => {
      if (direction === 'down') {
        if (prev === pid) return prev;
        return pid;
      }
      if (direction === 'up') {
        if (prev === pid) return null;
        return prev;
      }
      return prev;
    });
  }, [players]);

  const buildPlayerHandHistory = useCallback(
    (playerId: string) => {
      let running = 0;
      let alreadyLost = false;
      const rows: Array<{
        hand: number;
        before: number;
        delta: number | null;
        after: number;
        lost: boolean;
      }> = [];
      const hasCurrentHandEvent = events.some(
        e => e.playerId === playerId && e.hand === hand,
      );
      const maxHand = hasCurrentHandEvent ? hand : Math.max(0, hand - 1);
      for (let handNum = 1; handNum <= maxHand; handNum += 1) {
        const handEvents = events.filter(
          e => e.playerId === playerId && e.hand === handNum,
        );
        const before = running;
        const lostThisHand = handEvents.some(e => e.type === 'lost');

        if (handEvents.length === 0) {
          rows.push({
            hand: handNum,
            before,
            delta: null,
            after: before,
            lost: alreadyLost,
          });
          continue;
        }

        const delta = handEvents.reduce((acc, ev) => acc + ev.delta, 0);
        const after = before + delta;
        rows.push({
          hand: handNum,
          before,
          delta,
          after,
          lost: alreadyLost || lostThisHand,
        });
        running = after;
        if (lostThisHand) alreadyLost = true;
      }
      return rows;
    },
    [events, hand],
  );

  const activeDealerPlayers = useMemo(
    () => players.filter(p => !p.lost).map(p => ({ id: p.id, name: p.name })),
    [players],
  );

  const currentDealerName = useMemo(() => {
    const dealer = players.find(p => p.id === currentDealerId);
    return dealer?.name ?? '-';
  }, [players, currentDealerId]);

  return (
    <View style={styles.container}>
      {(isLostMode || isRemoveMode) && (
        <View style={styles.modeBar}>
          <Text style={styles.modeBarText}>
            {isLostMode
              ? 'Lost mode: tap a player to toggle LOST.'
              : 'Remove mode: tap a player to remove.'}
          </Text>

          <Pressable onPress={exitModes} style={styles.modeBarBtn}>
            <Text style={styles.modeBarBtnText}>Finish mode</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.topRow} onPress={() => setExpandedHistoryPlayerId(null)}>
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
        <Pressable
          onPress={openReorderDealers}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ alignItems: 'flex-end' }}
        >
          <Text style={styles.handText}>Dealer: {currentDealerName} (H{hand})</Text>
        </Pressable>
      </Pressable>

      <ScrollView contentContainerStyle={styles.listContent}>
        {displayPlayers.length === 0
          ? renderEmpty()
          : displayPlayers.map((item, index) => (
              <Animated.View
                key={item.id}
                style={{
                  transform: [
                    {
                      translateY:
                        reorderAnimValuesRef.current[item.id] ??
                        new Animated.Value(0),
                    },
                  ],
                }}
              >
                <PlayerItem
                  item={item}
                  index={index}
                  isRemoveMode={isRemoveMode}
                  isLostMode={isLostMode}
                  onAskRemovePlayer={askRemovePlayer}
                  onToggleLostForPlayer={toggleLostForPlayer}
                  onAddZeroQuick={addZeroQuick}
                  onOpenAddPoints={openAddPoints}
                  onOpenAdjust={openAdjust}
                  onShowPlayerHistory={openPlayerHistory}
                  isHistoryExpanded={expandedHistoryPlayerId === item.id}
                  handHistory={buildPlayerHandHistory(item.id)}
                />
              </Animated.View>
            ))}
        {renderFooter()}
      </ScrollView>

      <HeaderMenuModal
        isOpen={isHeaderMenuOpen}
        onClose={() => setIsHeaderMenuOpen(false)}
        onAddPlayer={openAddPlayerModal}
        onToggleLostMode={toggleLostMode}
        onToggleRemoveMode={toggleRemoveMode}
        onRenameGame={startRenameGame}
        onResetGame={openConfirmReset}
        onReorderDealers={openReorderDealers}
        onOpenOptions={openOptions}
        isLostMode={isLostMode}
        isRemoveMode={isRemoveMode}
      />

      {isReorderDealersOpen && (
        <ReorderDealersModal
          key={`reorder-dealers-${gameId}-${hand}`}
          isOpen={isReorderDealersOpen}
          onClose={() => setIsReorderDealersOpen(false)}
          players={activeDealerPlayers}
          initialOrder={dealerOrder}
          initialDealerId={currentDealerId}
          onSave={(nextOrder, nextDealerId) => {
            setDealerOrder(nextOrder);
            setCurrentDealerId(nextDealerId);
            setIsReorderDealersOpen(false);
          }}
        />
      )}

      <ConfirmRemovePlayerModal
        isOpen={isConfirmRemoveOpen}
        onClose={() => setIsConfirmRemoveOpen(false)}
        onConfirm={confirmRemovePlayer}
      />

      <ConfirmResetModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        onConfirm={performReset}
      />

      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        newName={newName}
        onChangeName={setNewName}
        onConfirm={confirmAddPlayer}
        canConfirm={canConfirmPlayer}
      />

      <AdjustScoreModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        adjustText={adjustText}
        onChangeText={setAdjustText}
        onConfirm={confirmAdjust}
        canConfirm={canConfirmAdjust}
        canShowUndo={canShowUndo}
        onUndo={undoLastForCurrentHand}
      />

      <AddPointsModal
        isOpen={isAddPointsOpen}
        onClose={() => setIsAddPointsOpen(false)}
        pointsText={pointsText}
        onChangeText={setPointsText}
        onConfirm={confirmAddPoints}
        canConfirm={canConfirmPoints}
        onShowFocus={focusPointsInput}
        inputRef={pointsInputRef}
      />

    </View>
  );
}
