import React from 'react';
import { Text, TextProps } from '../../components/Text';

interface IncognitoTextProps extends TextProps {
    incognito: boolean;
    children: React.ReactNode;
}

export function IncognitoText({ style, children, incognito, numberOfLines, variant, ...rest }: IncognitoTextProps) {
    if (!incognito) {
        return <Text variant={variant} style={style} numberOfLines={numberOfLines} {...rest}>{children}</Text>;
    }
    return (
        <Text variant={variant} style={[style, { letterSpacing: 1 }]} numberOfLines={numberOfLines} {...rest}>
            ••••••••••
        </Text>
    );
}
