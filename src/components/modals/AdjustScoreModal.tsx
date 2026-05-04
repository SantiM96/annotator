import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TextInput, Pressable, Platform } from 'react-native';
import { sharedModalStyles, getKeyboardAvoidingViewBehavior } from '../SharedModalStyles';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  adjustText: string;
  onChangeText: (text: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
  canShowUndo: boolean;
  onUndo: () => void;
};

export function AdjustScoreModal({
  isOpen,
  onClose,
  adjustText,
  onChangeText,
  onConfirm,
  canConfirm,
  canShowUndo,
  onUndo,
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
          <Text style={sharedModalStyles.modalTitle}>Adjust score</Text>

          <TextInput
            placeholder="Enter a number (e.g., -3 or 5)"
            placeholderTextColor="#9aa3af"
            value={adjustText}
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

            {canShowUndo && (
              <>
                <View style={{ width: 10 }} />
                <Pressable
                  onPress={onUndo}
                  style={[sharedModalStyles.btn, sharedModalStyles.btnDanger]}
                >
                  <Text style={sharedModalStyles.btnText}>Undo</Text>
                </Pressable>
              </>
            )}

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
