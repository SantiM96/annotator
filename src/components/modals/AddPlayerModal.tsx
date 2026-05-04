import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TextInput, Pressable } from 'react-native';
import { sharedModalStyles, getKeyboardAvoidingViewBehavior } from '../SharedModalStyles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newName: string;
  onChangeName: (text: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
};

export function AddPlayerModal({
  isOpen,
  onClose,
  newName,
  onChangeName,
  onConfirm,
  canConfirm,
}: Props) {
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
          <Text style={sharedModalStyles.modalTitle}>Add player</Text>

          <TextInput
            placeholder="Player name"
            placeholderTextColor="#9aa3af"
            value={newName}
            onChangeText={onChangeName}
            autoFocus
            style={[sharedModalStyles.input, { marginBottom: 10 }]}
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />

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
              disabled={!canConfirm}
              style={[
                sharedModalStyles.btn,
                canConfirm ? sharedModalStyles.btnPrimary : sharedModalStyles.btnDisabled,
              ]}
            >
              <Text
                style={[
                  sharedModalStyles.btnText,
                  !canConfirm && sharedModalStyles.btnTextDisabled,
                ]}
              >
                Add
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
