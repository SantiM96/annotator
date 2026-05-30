import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, Animated, Easing } from 'react-native';
import { styles } from './HistoryScreen.styles';
import {
  deleteGameFromHistory,
  getGameHistory,
  saveCurrentGame,
  type GameSave,
} from '../../storage/gameStorage';
import { loadAppOptions } from '../../storage/optionsStorage';
import { ConfirmDeleteHistoryGameModal } from '../../components/modals/ConfirmDeleteHistoryGameModal';

function AnimatedHandLog({
  expanded,
  item,
}: {
  expanded: boolean;
  item: GameSave;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? contentHeight : 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [contentHeight, expanded, heightAnim]);

  const logContent = useMemo(() => {
    if (item.events.length === 0) {
      return <Text style={styles.eventText}>No hand events yet.</Text>;
    }

    const runningScoreByPlayer: Record<string, number> = {};
    const lostPlayers = new Set<string>();
    return Object.entries(
      item.events.reduce<Record<number, typeof item.events>>((acc, ev) => {
        if (!acc[ev.hand]) acc[ev.hand] = [];
        acc[ev.hand].push(ev);
        return acc;
      }, {}),
    )
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([handNum, events]) => (
        <View key={`hand-${item.id}-${handNum}`} style={styles.handBlock}>
          <Text style={styles.handTitle}>Hand {handNum}</Text>
          {(() => {
            const playersWithEvent = new Set<string>();
            const eventRows = events.map(ev => {
              const before = runningScoreByPlayer[ev.playerId] ?? 0;
              const after = before + ev.delta;
              playersWithEvent.add(ev.playerId);
              runningScoreByPlayer[ev.playerId] = after;

              if (ev.type === 'lost') {
                lostPlayers.add(ev.playerId);
                return (
                  <View key={ev.id} style={styles.eventRow}>
                    <Text style={styles.eventLostPlayer}>{ev.playerName}:</Text>
                    <View style={styles.eventConnector} />
                    <Text style={styles.eventLostText}>{after} Lost</Text>
                  </View>
                );
              }

              const operator = ev.delta >= 0 ? '+' : '';
              return (
                <View key={ev.id} style={styles.eventRow}>
                  <Text style={styles.eventPlayer}>{ev.playerName}:</Text>
                  <View style={styles.eventConnector} />
                  {Number(handNum) === 1 ? (
                    <Text style={styles.eventText}>{after}</Text>
                  ) : (
                    <Text style={styles.eventText}>
                      {before} {operator} {ev.delta} = {after}
                    </Text>
                  )}
                </View>
              );
            });

            const noPointsRows = item.players
              .filter(p => !playersWithEvent.has(p.id) && !lostPlayers.has(p.id))
              .map(p => {
                const current = runningScoreByPlayer[p.id] ?? 0;
                return (
                  <View
                    key={`no-points-${item.id}-${handNum}-${p.id}`}
                    style={styles.eventRow}
                  >
                    <Text style={styles.eventPlayer}>{p.name}:</Text>
                    <View style={styles.eventConnector} />
                    {Number(handNum) === 1 ? (
                      <Text style={styles.eventMutedText}>{current}</Text>
                    ) : (
                      <Text style={styles.eventMutedText}>
                        {current} + empty = {current}
                      </Text>
                    )}
                  </View>
                );
              });

            return [...eventRows, ...noPointsRows];
          })()}
        </View>
      ));
  }, [item]);

  return (
    <>
      <Animated.View style={{ height: heightAnim, overflow: 'hidden' }}>
        <View
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) setContentHeight(h);
          }}
        >
          {logContent}
        </View>
      </Animated.View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          opacity: 0,
          left: 0,
          right: 0,
          zIndex: -1,
        }}
        onLayout={e => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== contentHeight) setContentHeight(h);
        }}
      >
        {logContent}
      </View>
    </>
  );
}

export default function HistoryScreen({ navigation }: { navigation: any }) {
  const [history, setHistory] = useState<GameSave[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const [games, options] = await Promise.all([
      getGameHistory(),
      loadAppOptions(),
    ]);

    const sortedGames = options.sortEnabled
      ? [...games].sort((a, b) =>
          options.sortDescending ? b.savedAt - a.savedAt : a.savedAt - b.savedAt,
        )
      : games;
    setHistory(sortedGames);
  }, []);

  useEffect(() => {
    loadHistory();
    const unsubscribe = navigation.addListener('focus', loadHistory);
    return unsubscribe;
  }, [navigation, loadHistory]);

  const resumeFromHistory = async (game: GameSave) => {
    await saveCurrentGame({ ...game, savedAt: Date.now() });
    navigation.navigate('Game', { resume: true, gameId: game.id });
  };

  const removeFromHistory = async (id: string) => {
    await deleteGameFromHistory(id);
    await loadHistory();
  };

  const toggleLog = (gameId: string) => {
    setExpandedLogs(prev => ({ ...prev, [gameId]: !prev[gameId] }));
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={history}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No saved games yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.gameName}>{item.gameName}</Text>
            <Text style={styles.meta}>
              Hand {item.hand} · {item.players.length} players
            </Text>
            <Text style={styles.meta}>
              {new Date(item.savedAt).toLocaleString()}
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => resumeFromHistory(item)}
                style={[styles.btn, styles.btnPrimary]}
              >
                <Text style={styles.btnText}>Resume</Text>
              </Pressable>
              <Pressable
                onPress={() => setPendingDeleteId(item.id)}
                style={[styles.btn, styles.btnDanger]}
              >
                <Text style={styles.btnText}>Delete</Text>
              </Pressable>
            </View>

            <View style={styles.eventsWrap}>
              <Pressable
                onPress={() => toggleLog(item.id)}
                style={styles.eventsHeaderBtn}
              >
                <Text style={styles.eventsTitle}>Hand log</Text>
                <Text style={styles.eventsToggle}>
                  {expandedLogs[item.id] ? 'Hide' : 'Show'}
                </Text>
              </Pressable>

              <AnimatedHandLog expanded={!!expandedLogs[item.id]} item={item} />
            </View>
          </View>
        )}
      />

      <ConfirmDeleteHistoryGameModal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          await removeFromHistory(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </View>
  );
}
