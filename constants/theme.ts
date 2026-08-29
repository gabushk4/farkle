/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
const HUE = 45; // doré

const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

export const Colors = {
    dark: {
        background: hsl(0, 0, 4),
        surface: hsl(0, 0, 11),
        surfaceElevated: hsl(0, 0, 17),
        accent: hsl(HUE, 65, 52),
        accentMuted: hsl(HUE, 45, 16),
        text: hsl(0, 0, 100),
        textSecondary: hsl(0, 0, 63),
        border: hsl(0, 0, 40),
        running: hsl(0, 0, 100),
        danger: hsl(4, 90, 58),
        tint: hsl(HUE, 65, 52),
    },
    light: {
        background: hsl(60, 15, 96),
        surface: hsl(50, 12, 89),
        surfaceElevated: hsl(0, 0, 100),
        accent: hsl(HUE, 70, 40),
        accentMuted: hsl(HUE, 40, 40),
        text: hsl(0, 0, 4),
        textSecondary: hsl(0, 0, 35),
        border: hsl(50, 10, 82),
        running: hsl(0, 0, 4),
        danger: hsl(4, 75, 47),
        tint: hsl(HUE, 70, 40),
    },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const Radius = { sm: 8, md: 12, lg: 20, full: 999 };
export const Typography = {
    scoreLarge: { fontSize: 36, fontWeight: '700' as const },
    scoreSmall: { fontSize: 16, fontWeight: '500' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
