import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, Pressable } from 'react-native';
import { sharedModalStyles, getKeyboardAvoidingViewBehavior } from '../SharedModalStyles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmResetModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={sharedModalStyles.modalBackdrop}
        behavior={getKeyboardAvoidingViewBehavior()}
      >
        <View style={sharedModalStyles.modalCard}>
          <Text style={sharedModalStyles.modalTitle}>Reset game?</Text>
          <Text style={{ color: '#374151', marginBottom: 10 }}>
            This will set Hand to 1 and all scores to 0.
          </Text>

          <View style={sharedModalStyles.actionsRow}>
            <Pressable
              onPress={onClose}
              style={[sharedModalStyles.btn, sharedModalStyles.btnGhost]}
            >
              <Text style={[sharedModalStyles.btnText, sharedModalStyles.btnGhostText]}>
                Cancel
              </Text>
            </Pressable>
            <View style={{ width: 10 }} />
            <Pressable
              onPress={onConfirm}
              style={[sharedModalStyles.btn, sharedModalStyles.btnDanger]}
            >
              <Text style={sharedModalStyles.btnText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
