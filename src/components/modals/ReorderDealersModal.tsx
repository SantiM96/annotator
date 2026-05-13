import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  type PanResponderInstance,
  Animated,
  Easing,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ROW_GAP, ROW_HEIGHT, styles } from './ReorderDealersModal.styles';

type DealerPlayer = { id: string; name: string };

type Props = {
  isOpen: boolean;
  players: DealerPlayer[];
  initialOrder: string[];
  initialDealerId: string | null;
  onClose: () => void;
  onSave: (nextOrder: string[], nextDealerId: string | null) => void;
};

function moveItem(order: string[], from: number, to: number) {
  if (from === to) return order;
  const copy = [...order];
  const [id] = copy.splice(from, 1);
  copy.splice(to, 0, id);
  return copy;
}

export function ReorderDealersModal({
  isOpen,
  players,
  initialOrder,
  initialDealerId,
  onClose,
  onSave,
}: Props) {
  const hamb = require('../../assets/images/hamb.png');
  const rowTotal = ROW_HEIGHT + ROW_GAP;
  const playerById = useMemo(
    () => Object.fromEntries(players.map(p => [p.id, p])),
    [players],
  );

  const normalizedOrder = useMemo(() => {
    const allowed = new Set(players.map(p => p.id));
    const base = initialOrder.filter(id => allowed.has(id));
    const missing = players.map(p => p.id).filter(id => !base.includes(id));
    return [...base, ...missing];
  }, [initialOrder, players]);

  const [order, setOrder] = useState<string[]>(normalizedOrder);
  const [dealerId, setDealerId] = useState<string | null>(initialDealerId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartTop, setDragStartTop] = useState(0);
  const [dragDy, setDragDy] = useState(0);

  const panMapRef = useRef<Map<string, PanResponderInstance>>(new Map());
  const topMapRef = useRef<Map<string, Animated.Value>>(new Map());
  const orderRef = useRef<string[]>(normalizedOrder);
  const draggingIdRef = useRef<string | null>(null);
  const dragStartIndexRef = useRef(0);
  const dragStartTopRef = useRef(0);
  const dragCurrentIndexRef = useRef(0);
  const tapStateRef = useRef<{ id: string | null; at: number }>({ id: null, at: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setOrder(normalizedOrder);
    setDealerId(
      initialDealerId && normalizedOrder.includes(initialDealerId)
        ? initialDealerId
        : normalizedOrder[0] ?? null,
    );
    setDraggingId(null);
    setDragStartTop(0);
    setDragDy(0);
    orderRef.current = normalizedOrder;
    draggingIdRef.current = null;
    dragStartIndexRef.current = 0;
    dragStartTopRef.current = 0;
    dragCurrentIndexRef.current = 0;
    topMapRef.current = new Map();
    normalizedOrder.forEach((id, idx) => {
      topMapRef.current.set(id, new Animated.Value(idx * rowTotal));
    });
  }, [isOpen, normalizedOrder, initialDealerId, rowTotal]);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    order.forEach((id, idx) => {
      let v = topMapRef.current.get(id);
      if (!v) {
        v = new Animated.Value(idx * rowTotal);
        topMapRef.current.set(id, v);
      }
      if (draggingIdRef.current === id) return;
      Animated.timing(v, {
        toValue: idx * rowTotal,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
  }, [order, rowTotal]);

  const stopDrag = () => {
    const activeDragId = draggingIdRef.current;
    const finalIndex = activeDragId
      ? Math.max(0, orderRef.current.indexOf(activeDragId))
      : dragCurrentIndexRef.current;
    if (activeDragId) {
      const finalTop = finalIndex * rowTotal;
      let v = topMapRef.current.get(activeDragId);
      if (!v) {
        v = new Animated.Value(finalTop);
        topMapRef.current.set(activeDragId, v);
      }
      v.setValue(finalTop);
    }

    setDraggingId(null);
    setDragStartTop(0);
    setDragDy(0);
    draggingIdRef.current = null;
    dragStartIndexRef.current = 0;
    dragStartTopRef.current = 0;
    dragCurrentIndexRef.current = 0;
  };

  const handleReorderMove = (dy: number) => {
    if (!draggingIdRef.current) return;
    setDragDy(dy);
    const raw = Math.round((dragStartTopRef.current + dy) / rowTotal);
    const target = Math.max(0, Math.min(orderRef.current.length - 1, raw));
    const current = dragCurrentIndexRef.current;
    if (target === current) return;
    const next = moveItem(orderRef.current, current, target);
    orderRef.current = next;
    dragCurrentIndexRef.current = target;
    setOrder(next);
  };

  const getPanResponder = (id: string) => {
    if (
      !panMapRef.current ||
      typeof (panMapRef.current as any).get !== 'function' ||
      typeof (panMapRef.current as any).set !== 'function'
    ) {
      panMapRef.current = new Map();
    }

    const existing = panMapRef.current.get(id);
    if (existing) return existing;

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const idx = orderRef.current.indexOf(id);
        if (idx < 0) return;
        const topValue = topMapRef.current.get(id);
        const visualTop =
          topValue && typeof (topValue as any).__getValue === 'function'
            ? Number((topValue as any).__getValue())
            : idx * rowTotal;
        setDraggingId(id);
        setDragStartTop(visualTop);
        setDragDy(0);
        draggingIdRef.current = id;
        dragStartIndexRef.current = idx;
        dragStartTopRef.current = visualTop;
        dragCurrentIndexRef.current = idx;
      },
      onPanResponderMove: (_, gesture) => {
        const moved = Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4;
        if (moved) {
          handleReorderMove(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const moved = Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4;
        if (!moved) {
          const now = Date.now();
          const isDoubleTap =
            tapStateRef.current.id === id && now - tapStateRef.current.at < 260;
          tapStateRef.current = { id, at: now };
          if (isDoubleTap) setDealerId(id);
        } else {
          // Ensure the final drop index uses the last release delta too.
          handleReorderMove(gesture.dy);
        }
        stopDrag();
      },
      onPanResponderTerminate: () => stopDrag(),
      onPanResponderTerminationRequest: () => false,
    });

    panMapRef.current.set(id, responder);
    return responder;
  };

  const renderRow = (id: string, isPlaceholder = false) => {
    const p = playerById[id];
    if (!p) return null;
    const isDealer = dealerId === id;
    return (
      <View
        key={`${id}-${isPlaceholder ? 'placeholder' : 'row'}`}
        style={[
          styles.row,
          isDealer && styles.rowDealer,
          isPlaceholder && styles.placeholder,
        ]}
      >
        <Text style={[styles.rowName, isDealer && styles.rowDealerName]}>{p.name}</Text>
        <View pointerEvents="none" style={styles.hambCenterWrap}>
          <Image source={hamb} style={styles.hamb} />
        </View>
        <View style={styles.rowRight}>
          {isDealer && <Text style={styles.dealerTag}>Current dealer</Text>}
        </View>
      </View>
    );
  };

  const dragTop = dragStartTop + dragDy;

  const getRowTop = (id: string, idx: number) => {
    let v = topMapRef.current.get(id);
    if (!v) {
      v = new Animated.Value(idx * rowTotal);
      topMapRef.current.set(id, v);
    }
    return v;
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Reorder dealers</Text>

          <View
            style={[
              styles.listWrap,
              { height: Math.max(0, order.length * rowTotal - ROW_GAP) },
            ]}
          >
            {order.map((id, idx) => (
              <Animated.View
                key={id}
                {...getPanResponder(id).panHandlers}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: getRowTop(id, idx),
                }}
              >
                {draggingId === id ? renderRow(id, true) : renderRow(id)}
              </Animated.View>
            ))}

            {draggingId && (
              <View style={[styles.dragRow, { top: dragTop }]}>
                {renderRow(draggingId)}
              </View>
            )}
          </View>

          <Text style={styles.helperText}>Double tap to select a new current dealer.</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => onSave(order, dealerId)}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
