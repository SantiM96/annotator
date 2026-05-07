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
  FlatList,
  Keyboard,
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

import { Player, PlayerItem } from '../../components/PlayerItem/PlayerItem';
import { HeaderMenuModal } from '../../components/modals/HeaderMenuModal';
import { ConfirmRemovePlayerModal } from '../../components/modals/ConfirmRemovePlayerModal';
import { ConfirmResetModal } from '../../components/modals/ConfirmResetModal';
import { AddPlayerModal } from '../../components/modals/AddPlayerModal';
import { AdjustScoreModal } from '../../components/modals/AdjustScoreModal';
import { AddPointsModal } from '../../components/modals/AddPointsModal';

type RootStackParamList = {
  Home: undefined;
  Game: { resume?: boolean; gameId?: string } | undefined;
  History: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  const [gameId, setGameId] = useState(() => `game-${Date.now()}`);
  const [events, setEvents] = useState<GameEvent[]>([]);
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

  const [handDeltas, setHandDeltas] = useState<Record<string, number>>({});

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState('');
  const [adjustIndex, setAdjustIndex] = useState<number | null>(null);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const [isLostMode, setIsLostMode] = useState(false);

  const pointsInputRef = useRef<TextInput | null>(null);

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
      prev.map(p => ({ ...p, score: 0, played: false, lost: false })),
    );
    setEvents(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        type: 'reset',
        hand,
        playerId: 'system',
        playerName: 'System',
        delta: 0,
        at: Date.now(),
      },
    ]);
    setHand(1);
    setHandDeltas({});
    setIsConfirmResetOpen(false);
  }, [hand]);

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
          setHandDeltas({});
          saveCurrentGame(snapshot).catch(() => {});
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [route.params]);

  useEffect(() => {
    const snapshot: GameSave = {
      id: gameId,
      gameName,
      hand,
      players,
      events,
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
  }, [players, hand, gameName, gameId, events]);

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
    if (players[index].played) return;
    if (players[index].lost) return;
    setSelectedIndex(index);
    setPointsText('');
    setIsAddPointsOpen(true);
  }, [players]);

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
        setHand(h => h + 1);
        setHandDeltas({});
      }

      return copy;
    });
  }, [hand, pushEvent]);

  const confirmAddPoints = () => {
    if (!canConfirmPoints || selectedIndex === null) return;
    const delta = Number(pointsText);
    applyDeltaToPlayer(selectedIndex, delta);

    setIsAddPointsOpen(false);
    setSelectedIndex(null);
    setPointsText('');
  };

  const addZeroQuick = useCallback((index: number) => {
    if (players[index]?.played) return;
    if (players[index]?.lost) return;
    applyDeltaToPlayer(index, 0);
  }, [players, applyDeltaToPlayer]);

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
        setHand(h => h + 1);
        setHandDeltas({});
      }

      return copy;
    });
  }, []);

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
        setHand(h => h + 1);
        setHandDeltas({});
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
        extraData={players.map(p => `${p.played}-${p.lost}`).join(',')}
        renderItem={({ item, index }) => (
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
          />
        )}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />

      <HeaderMenuModal
        isOpen={isHeaderMenuOpen}
        onClose={() => setIsHeaderMenuOpen(false)}
        onAddPlayer={openAddPlayerModal}
        onToggleLostMode={toggleLostMode}
        onToggleRemoveMode={toggleRemoveMode}
        onRenameGame={startRenameGame}
        onResetGame={openConfirmReset}
        isLostMode={isLostMode}
        isRemoveMode={isRemoveMode}
      />

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
