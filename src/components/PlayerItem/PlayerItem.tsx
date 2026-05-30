import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, Image } from 'react-native';
import { styles } from './PlayerItem.styles';

export type Player = {
  id: string;
  name: string;
  score: number;
  played: boolean;
  lost: boolean;
};

type Props = {
  item: Player;
  index: number;
  isRemoveMode: boolean;
  isLostMode: boolean;
  onAskRemovePlayer: (index: number) => void;
  onToggleLostForPlayer: (index: number) => void;
  onAddZeroQuick: (index: number) => void;
  onOpenAddPoints: (index: number) => void;
  onOpenAdjust: (index: number) => void;
  onShowPlayerHistory: (index: number, direction: 'down' | 'up') => void;
  isHistoryExpanded: boolean;
  handHistory: Array<{
    hand: number;
    before: number;
    delta: number | null;
    after: number;
    lost: boolean;
  }>;
};

export function PlayerItem({
  item,
  index,
  isRemoveMode,
  isLostMode,
  onAskRemovePlayer,
  onToggleLostForPlayer,
  onAddZeroQuick,
  onOpenAddPoints,
  onOpenAdjust,
  onShowPlayerHistory,
  isHistoryExpanded,
  handHistory,
}: Props) {
  const doubleDownArrow = require('../../assets/images/doble-down-arrow.png');
  const longPressGuard = useRef(false);
  const swipeGuard = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const tripleTapRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ count: 0, timer: null });

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const targetHeight = useMemo(
    () => Math.max(0, handHistory.length * 22 + 20),
    [handHistory.length],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isHistoryExpanded ? targetHeight : 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation, {
        toValue: isHistoryExpanded ? 1 : 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animatedHeight, animatedRotation, isHistoryExpanded, targetHeight]);

  const rotate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const clearTripleTapTimer = () => {
    if (tripleTapRef.current.timer) {
      clearTimeout(tripleTapRef.current.timer);
      tripleTapRef.current.timer = null;
    }
  };

  const resetTripleTap = () => {
    tripleTapRef.current.count = 0;
    clearTripleTapTimer();
  };

  const handlePress = () => {
    if (swipeGuard.current) {
      swipeGuard.current = false;
      return;
    }
    if (longPressGuard.current) {
      longPressGuard.current = false;
      return;
    }
    if (isRemoveMode) {
      onAskRemovePlayer(index);
      return;
    }
    if (isLostMode) {
      onToggleLostForPlayer(index);
      return;
    }
    if (item.lost) return;
    if (item.played) return;

    const t = tripleTapRef.current;
    t.count += 1;
    clearTripleTapTimer();

    if (t.count === 3) {
      resetTripleTap();
      onAddZeroQuick(index);
      return;
    }

    t.timer = setTimeout(() => {
      resetTripleTap();
      onOpenAddPoints(index);
    }, 300);
  };

  const handlePressIn = (e: any) => {
    pressStart.current = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
    };
    swipeGuard.current = false;
  };

  const handlePressOut = (e: any) => {
    if (!pressStart.current) return;
    if (isRemoveMode || isLostMode) return;

    const dx = e.nativeEvent.pageX - pressStart.current.x;
    const dy = e.nativeEvent.pageY - pressStart.current.y;

    if (Math.abs(dx) < 24 && !swipeGuard.current && dy > 28) {
      swipeGuard.current = true;
      clearTripleTapTimer();
      onShowPlayerHistory(index, 'down');
    } else if (Math.abs(dx) < 24 && !swipeGuard.current && dy < -28) {
      swipeGuard.current = true;
      clearTripleTapTimer();
      onShowPlayerHistory(index, 'up');
    }

    pressStart.current = null;
  };

  const handleLongPress = () => {
    clearTripleTapTimer();
    longPressGuard.current = true;
    onOpenAdjust(index);
    setTimeout(() => {
      longPressGuard.current = false;
    }, 250);
  };

  return (
    <View style={styles.playerCardShell}>
      <View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        style={[
          styles.playerCard,
          item.played && styles.playerDisabled,
          item.lost && styles.playerLost,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={2000}
          android_ripple={{ color: '#00000010' }}
          style={styles.playerItem}
        >
          <View style={styles.leftWrap}>
            <Text style={styles.playerIndex}>{index + 1}.</Text>
            <Text style={[styles.playerName, item.lost && styles.playerNameLost]}>
              {item.name}
            </Text>
            {item.lost && <Text style={styles.lostBadge}>LOST</Text>}
          </View>
          <Text style={[styles.playerScore, item.lost && styles.playerScoreLost]}>
            {item.played ? ' ' : ''}
            {item.score}
          </Text>
        </Pressable>

        <Animated.View style={[styles.historyAnimatedWrap, { height: animatedHeight }]}>
          <View style={styles.historyWrap}>
            {handHistory.map(row => (
              <View key={`${item.id}-hand-${row.hand}`} style={styles.historyRow}>
                <Text style={styles.historyHand}>Hand {row.hand}:</Text>
                <View style={styles.historyConnector} />
                {row.lost ? (
                  <Text style={styles.historyValueLost}>{row.after} Lost</Text>
                ) : row.hand === 1 ? (
                  <Text style={styles.historyValue}>{row.after}</Text>
                ) : (
                  <Text style={styles.historyValue}>
                    {row.before} + {row.delta === null ? 'empty' : row.delta} ={' '}
                    {row.after}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.expandHint, { transform: [{ rotate }] }]}>
        <Image
          source={doubleDownArrow}
          style={styles.expandHintIcon}
          accessibilityLabel="expand"
        />
      </Animated.View>
    </View>
  );
}
