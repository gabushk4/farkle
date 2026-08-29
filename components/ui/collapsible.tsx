import { PropsWithChildren, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function Collapsible({ children, title, childrenMaxHeight, onPress }: PropsWithChildren & { title: string; childrenMaxHeight: number; onPress?:()=>void }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme]

  const childrenHeight = useSharedValue(0)

  const childrenAnimated = useAnimatedStyle(() => ({
    height: childrenHeight.value
  }))

  useEffect(() => {
    if (isOpen) {
      childrenHeight.value = withTiming(childrenMaxHeight, {duration:300})
    } else
      childrenHeight.value = withTiming(0, {duration:300})
  }, [isOpen])

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => {
          setIsOpen((value) => !value)
          onPress?.()
        }}
        activeOpacity={0.9}>
        
        <Text style={{color:colors.textSecondary, fontSize:16}}>{title}</Text>
        <FontAwesome6 name={isOpen ?"chevron-down":"chevron-right"} size={16} color={colors.border} />        
      </TouchableOpacity>
      <Animated.View style={[childrenAnimated, styles.content ]}>
        { children }
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
    overflow:'hidden',
  },
});
