import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Fonts } from '../lib/fonts';

export interface TextProps extends RNTextProps {
    variant?: keyof typeof Fonts;
}

/**
 * Drop-in Text with optional variant prop.
 * variant="display"  → JakartaBold   (headings)
 * variant="brand"    → JakartaMedium (labels / buttons)
 * variant="sans"     → InterRegular  (body / lists)
 * variant="sansBold" → InterSemiBold (prices / badges)
 * No variant         → system font (default RN behaviour)
 */
export function Text({ style, variant, ...props }: TextProps) {
    const fontFamily = variant ? Fonts[variant] : undefined;
    return <RNText style={[fontFamily ? { fontFamily } : undefined, style]} {...props} />;
}
