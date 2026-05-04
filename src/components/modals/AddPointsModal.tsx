import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TextInput, Pressable, Platform } from 'react-native';
import { sharedModalStyles, getKeyboardAvoidingViewBehavior } from '../SharedModalStyles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pointsText: string;
  onChangeText: (text: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
  onShowFocus: () => void;
  inputRef: React.Ref<TextInput>;
};

export function AddPointsModal({
  isOpen,
  onClose,
  pointsText,
  onChangeText,
  onConfirm,
  canConfirm,
  onShowFocus,
  inputRef,
}: Props) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onShow={onShowFocus}
    >
      <KeyboardAvoidingView
        style={sharedModalStyles.modalBackdrop}
        behavior={getKeyboardAvoidingViewBehavior()}
      >
        <View style={sharedModalStyles.modalCard}>
          <Text style={sharedModalStyles.modalTitle}>Add points</Text>

          <TextInput
            ref={inputRef}
            placeholder="e.g. 5  (use -3 to subtract)"
            placeholderTextColor="#9aa3af"
            value={pointsText}
            onChangeText={onChangeText}
            keyboardType={Platform.select({
              ios: 'numbers-and-punctuation',
              android: 'numeric',
            })}
            autoFocus
            style={sharedModalStyles.input}
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
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
