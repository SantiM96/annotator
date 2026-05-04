import { useEffect, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { styles } from './HomeScreen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearCurrentGame, hasCurrentGame } from '../../storage/gameStorage';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [canResume, setCanResume] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setCanResume(await hasCurrentGame());
    });
    return unsubscribe;
  }, [navigation]);

  const startNewGame = async () => {
    await clearCurrentGame(); // ensure fresh start
    navigation.navigate('Game'); // no resume flag
  };

  const resumeGame = () => {
    navigation.navigate('Game', { resume: true });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.column}>
        {canResume && (
          <Pressable
            onPress={resumeGame}
            android_ripple={{ color: '#00000022' }}
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnSecondaryText}>Resume</Text>
          </Pressable>
        )}

        <Pressable
          onPress={startNewGame}
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

