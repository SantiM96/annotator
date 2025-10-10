import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.column}>
        <Pressable
          onPress={() => navigation.navigate('Game')}
          android_ripple={{ color: '#00000022' }}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>New game</Text>
        </Pressable>


        <Pressable
          onPress={() => navigation.navigate('History')}
          android_ripple={{ color: '#00000022' }}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>History</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },

  column: { width: 150, gap: 12 },
  
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    width: '100%',
    alignItems: 'center',
  },

  btnPressed: { opacity: 0.85 },

  btnText: { color: 'white', fontSize: 18, fontWeight: '600' },
});
