import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnalyticsColors as C } from '../../analytics/config';

/** `hint` is shown under the label in the picker so each choice explains itself. */
export type PillOption<T> = { value: T; label: string; hint?: string };

type Props<T> = {
  value: T;
  options: PillOption<T>[];
  onChange: (v: T) => void;
  title: string;
};

/** Small "Today ▾" pill from the Analytics mockup; opens a picker. */
export default function DropdownPill<T extends string | number>({ value, options, onChange, title }: Props<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? String(value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${current}`}
      >
        <Text style={styles.pillText}>{current}</Text>
        <Ionicons name="chevron-down" size={14} color={C.primaryDark} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <Pressable
                  key={String(o.value)}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{o.label}</Text>
                    {o.hint ? <Text style={styles.optionHint}>{o.hint}</Text> : null}
                  </View>
                  {selected && <Ionicons name="checkmark" size={18} color={C.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.primarySoft,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillPressed: { opacity: 0.7 },
  pillText: { color: C.primaryDark, fontSize: 13, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 42, 27, 0.35)', justifyContent: 'center', padding: 40 },
  sheet: { backgroundColor: C.card, borderRadius: 16, padding: 8 },
  sheetTitle: { color: C.muted, fontSize: 12, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionSelected: { backgroundColor: C.primaryTint },
  optionTextWrap: { flex: 1, paddingRight: 8 },
  optionText: { color: C.text, fontSize: 15, fontWeight: '600' },
  optionTextSelected: { color: C.primary, fontWeight: '800' },
  optionHint: { color: C.muted, fontSize: 12, marginTop: 2 },
});
