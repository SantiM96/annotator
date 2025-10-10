import React, { useLayoutEffect, useMemo, useState } from 'react';
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

type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  History: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Player = { id: string; name: string; score: number };

export default function GameScreen({ navigation }: Props) {
  // --- Estado principal
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // --- Modal para sumar puntos
  const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
  const [pointsText, setPointsText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const canConfirmPlayer = useMemo(() => newName.trim().length > 0, [newName]);
  const canConfirmPoints = useMemo(
    () => pointsText.trim().length > 0 && !Number.isNaN(Number(pointsText)),
    [pointsText]
  );

  // Botón del header (arriba a la derecha)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setIsAddPlayerOpen(true)} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>＋ Add player</Text>
        </Pressable>
      ),
      title: 'Game',
    });
  }, [navigation]);

  // --- Add player
  const confirmAddPlayer = () => {
    if (!canConfirmPlayer) return;
    const p: Player = {
      id: `${Date.now()}-${Math.random()}`,
      name: newName.trim(),
      score: 0,
    };
    setPlayers(prev => [...prev, p]);
    setIsAddPlayerOpen(false);
    setNewName('');
  };

  // --- Add points
  const openAddPoints = (index: number) => {
    setSelectedIndex(index);
    setPointsText('');
    setIsAddPointsOpen(true);
  };
  const confirmAddPoints = () => {
    if (!canConfirmPoints || selectedIndex === null) return;
    const delta = Number(pointsText);
    setPlayers(prev => {
      const copy = [...prev];
      copy[selectedIndex] = { ...copy[selectedIndex], score: copy[selectedIndex].score + delta };
      return copy;
    });
    setIsAddPointsOpen(false);
    setSelectedIndex(null);
    setPointsText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSpacer} />
      <Text style={styles.title}>Game</Text>

      {players.length === 0 ? (
        <Text style={styles.emptyHint}>No players yet. Add one!</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={players}
          keyExtractor={p => p.id}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openAddPoints(index)}
              android_ripple={{ color: '#00000010' }}
              style={({ pressed }) => [styles.playerItem, pressed && styles.playerPressed]}
            >
              <View style={styles.leftWrap}>
                <Text style={styles.playerIndex}>{index + 1}.</Text>
                <Text style={styles.playerName}>{item.name}</Text>
              </View>
              <Text style={styles.playerScore}>{item.score}</Text>
            </Pressable>
          )}
        />
      )}

      {/* Modal: agregar jugador */}
      <Modal visible={isAddPlayerOpen} transparent animationType="fade" onRequestClose={() => setIsAddPlayerOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add player</Text>
            <TextInput
              placeholder="Player name"
              placeholderTextColor="#9aa3af"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              autoFocus
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmAddPlayer}
            />
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setIsAddPlayerOpen(false)} style={[styles.btn, styles.btnGhost]}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Cancel</Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                onPress={confirmAddPlayer}
                disabled={!canConfirmPlayer}
                style={[styles.btn, canConfirmPlayer ? styles.btnPrimary : styles.btnDisabled]}
              >
                <Text style={[styles.btnText, !canConfirmPlayer && styles.btnTextDisabled]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: sumar puntos */}
      <Modal visible={isAddPointsOpen} transparent animationType="fade" onRequestClose={() => setIsAddPointsOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add points</Text>
            <TextInput
              placeholder="e.g. 5  (use -3 to subtract)"
              placeholderTextColor="#9aa3af"
              value={pointsText}
              onChangeText={setPointsText}
              keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
              autoFocus
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmAddPoints}
            />
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setIsAddPointsOpen(false)} style={[styles.btn, styles.btnGhost]}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Cancel</Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                onPress={confirmAddPoints}
                disabled={!canConfirmPoints}
                style={[styles.btn, canConfirmPoints ? styles.btnPrimary : styles.btnDisabled]}
              >
                <Text style={[styles.btnText, !canConfirmPoints && styles.btnTextDisabled]}>Confirm</Text>
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
  headerSpacer: { height: 8 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  emptyHint: { textAlign: 'center', color: '#6b7280', marginTop: 8 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

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
  playerPressed: { opacity: 0.9 },
  leftWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  playerIndex: { width: 22, textAlign: 'right', marginRight: 8, color: '#6b7280' },
  playerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  playerScore: { fontSize: 16, fontWeight: '700', color: '#ef4444' },

  // Header button
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
  headerBtnText: { color: 'white', fontWeight: '700' },

  // Modal base
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },

  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnTextDisabled: { color: '#e5e7eb' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#d1d5db' },
  btnGhostText: { color: '#374151' },
});
