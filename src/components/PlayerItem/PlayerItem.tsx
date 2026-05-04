import React, { useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
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
}: Props) {
  const longPressGuard = useRef(false);
  const tripleTapRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ count: 0, timer: null });

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

  const handleLongPress = () => {
    clearTripleTapTimer();

    longPressGuard.current = true;
    onOpenAdjust(index);
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
        item.lost && styles.playerLost,
      ]}
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
  );
}

