import React from 'react';
import { Modal, Pressable, View, Text } from 'react-native';
import { styles } from './HeaderMenuModal.styles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: () => void;
  onToggleLostMode: () => void;
  onToggleRemoveMode: () => void;
  onRenameGame: () => void;
  onResetGame: () => void;
  onReorderDealers: () => void;
  isLostMode: boolean;
  isRemoveMode: boolean;
};

export function HeaderMenuModal({
  isOpen,
  onClose,
  onAddPlayer,
  onToggleLostMode,
  onToggleRemoveMode,
  onRenameGame,
  onResetGame,
  onReorderDealers,
  isLostMode,
  isRemoveMode,
}: Props) {
  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuBackdrop} onPress={onClose} />
      <View pointerEvents="box-none" style={styles.menuContainer}>
        <View style={styles.menuCard}>
          <Pressable onPress={onAddPlayer} style={styles.menuItem}>
            <Text style={styles.menuItemText}>Add player</Text>
          </Pressable>

          <Pressable onPress={onToggleLostMode} style={styles.menuItem}>
            <Text style={styles.menuItemText}>
              {isLostMode ? 'Disable lost mode' : 'Enable lost mode'}
            </Text>
          </Pressable>

          <Pressable onPress={onToggleRemoveMode} style={styles.menuItem}>
            <Text style={styles.menuItemText}>
              {isRemoveMode ? 'Disable remove mode' : 'Enable remove mode'}
            </Text>
          </Pressable>

          <Pressable onPress={onRenameGame} style={styles.menuItem}>
            <Text style={styles.menuItemText}>Rename game</Text>
          </Pressable>

          <Pressable onPress={onReorderDealers} style={styles.menuItem}>
            <Text style={styles.menuItemText}>Reorder dealers</Text>
          </Pressable>

          <Pressable onPress={onResetGame} style={styles.menuItem}>
            <Text style={[styles.menuItemText, styles.menuDanger]}>Reset</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.menuItem}>
            <Text style={[styles.menuItemText, styles.menuCancel]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

