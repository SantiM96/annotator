import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { sharedModalStyles } from '../SharedModalStyles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteHistoryGameModal({
  isOpen,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={sharedModalStyles.modalBackdrop}>
        <View style={sharedModalStyles.modalCard}>
          <Text style={sharedModalStyles.modalTitle}>Delete saved game?</Text>
          <Text style={{ color: '#374151', marginBottom: 10 }}>
            This action cannot be undone.
          </Text>
          <View style={sharedModalStyles.actionsRow}>
            <Pressable
              onPress={onClose}
              style={[sharedModalStyles.btn, sharedModalStyles.btnGhost]}
            >
              <Text
                style={[sharedModalStyles.btnText, sharedModalStyles.btnGhostText]}
              >
                Cancel
              </Text>
            </Pressable>
            <View style={{ width: 10 }} />
            <Pressable
              onPress={onConfirm}
              style={[sharedModalStyles.btn, sharedModalStyles.btnDanger]}
            >
              <Text style={sharedModalStyles.btnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
