import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { styles } from './OptionsScreen.styles';
import {
  loadAppOptions,
  saveAppOptions,
  type AppOptions,
} from '../../storage/optionsStorage';

export default function OptionsScreen() {
  const [options, setOptions] = useState<AppOptions>({
    sortEnabled: false,
    sortDescending: true,
    burakoMode: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadAppOptions();
      if (mounted) setOptions(stored);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateOptions = useCallback((next: AppOptions) => {
    setOptions(next);
    saveAppOptions(next).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.labelWrap}>
            <Text style={styles.title}>Sort by</Text>
            <Text style={styles.subtitle}>Enable automatic sorting.</Text>
          </View>
          <Switch
            value={options.sortEnabled}
            onValueChange={value =>
              updateOptions({ ...options, sortEnabled: value })
            }
          />
        </View>

        {options.sortEnabled && (
          <View style={styles.subOptionWrap}>
            <Text style={styles.subOptionTitle}>Order</Text>
            <Pressable
              onPress={() =>
                updateOptions({
                  ...options,
                  sortDescending: true,
                })
              }
              style={[
                styles.optionBtn,
                options.sortDescending && styles.optionBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  options.sortDescending && styles.optionBtnTextActive,
                ]}
              >
                Highest first
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                updateOptions({
                  ...options,
                  sortDescending: false,
                })
              }
              style={[
                styles.optionBtn,
                !options.sortDescending && styles.optionBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  !options.sortDescending && styles.optionBtnTextActive,
                ]}
              >
                Lowest first
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.subOptionWrap}>
          <View style={styles.row}>
            <View style={styles.labelWrap}>
              <Text style={styles.subOptionTitle}>Burako mode</Text>
              <Text style={styles.subtitle}>
                Auto-assign last player's round score as negative sum of others.
              </Text>
            </View>
            <Switch
              value={options.burakoMode}
              onValueChange={value =>
                updateOptions({ ...options, burakoMode: value })
              }
            />
          </View>
        </View>
      </View>
    </View>
  );
}
