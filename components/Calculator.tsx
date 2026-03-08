import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Calculator as CalcIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = (width - 48 - 3 * 16) / 4; // 24px padding each side, 16px gap between 4 cols

type ButtonType = 'number' | 'operator' | 'action';

interface CalcButtonProps {
    label: string;
    type: ButtonType;
    onPress: (label: string) => void;
    isDouble?: boolean;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, type, onPress, isDouble }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.9, { duration: 100 });
        opacity.value = withTiming(0.6, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
        opacity.value = withTiming(1, { duration: 100 });
    };

    const getColors = () => {
        switch (type) {
            case 'operator':
                return { bg: '#FF9F0A', text: '#FFF' };
            case 'action':
                return { bg: '#A5A5A5', text: '#000' };
            case 'number':
            default:
                return { bg: '#333333', text: '#FFF' };
        }
    };

    const { bg, text } = getColors();

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onPress(label)}
            style={[
                styles.buttonContainer,
                { width: isDouble ? BUTTON_SIZE * 2 + 16 : BUTTON_SIZE, backgroundColor: bg }
            ]}
        >
            <Animated.View style={[styles.buttonInner, animatedStyle]}>
                <Text style={[styles.buttonText, { color: text, textAlign: isDouble ? 'left' : 'center', paddingLeft: isDouble ? 24 : 0 }]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export const Calculator: React.FC = () => {
    const router = useRouter();
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForNewValue, setWaitingForNewValue] = useState(false);

    const handlePress = (label: string) => {
        if (label === '=') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.selectionAsync();
        }

        switch (label) {
            case 'AC':
                setDisplay('0');
                setPrevValue(null);
                setOperator(null);
                setWaitingForNewValue(false);
                break;
            case '+/-':
                setDisplay((parseFloat(display) * -1).toString());
                break;
            case '%':
                setDisplay((parseFloat(display) / 100).toString());
                break;
            case '+':
            case '-':
            case '×':
            case '÷':
                setOperator(label);
                setPrevValue(parseFloat(display));
                setWaitingForNewValue(true);
                break;
            case '=':
                if (operator && prevValue !== null) {
                    const current = parseFloat(display);
                    let result = 0;
                    if (operator === '+') result = prevValue + current;
                    if (operator === '-') result = prevValue - current;
                    if (operator === '×') result = prevValue * current;
                    if (operator === '÷') result = prevValue / current;
                    setDisplay(result.toString());
                    setPrevValue(null);
                    setOperator(null);
                    setWaitingForNewValue(true);
                }
                break;
            case '.':
                if (waitingForNewValue) {
                    setDisplay('0.');
                    setWaitingForNewValue(false);
                } else if (!display.includes('.')) {
                    setDisplay(display + '.');
                }
                break;
            default: // Number
                if (waitingForNewValue) {
                    setDisplay(label);
                    setWaitingForNewValue(false);
                } else {
                    setDisplay(display === '0' ? label : display + label);
                }
                break;
        }
    };

    const handlePushToSub = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to add subscription page with the parameter
        // Assumes Add screen accepts an `amount` param in its local state usage
        router.push({ pathname: '/add', params: { initialAmount: display } });
    };

    // Auto-scale font depending on length
    const fontSize = display.length > 7 ? 48 : display.length > 5 ? 64 : 80;

    return (
        <View style={styles.container}>
            {/* Display Area */}
            <View style={styles.displayContainer}>
                <Text style={[styles.displayText, { fontSize }]} numberOfLines={1} adjustsFontSizeToFit>
                    {display}
                </Text>
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                <View style={styles.row}>
                    <CalcButton label="AC" type="action" onPress={handlePress} />
                    <CalcButton label="+/-" type="action" onPress={handlePress} />
                    <CalcButton label="%" type="action" onPress={handlePress} />
                    <CalcButton label="÷" type="operator" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <CalcButton label="7" type="number" onPress={handlePress} />
                    <CalcButton label="8" type="number" onPress={handlePress} />
                    <CalcButton label="9" type="number" onPress={handlePress} />
                    <CalcButton label="×" type="operator" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <CalcButton label="4" type="number" onPress={handlePress} />
                    <CalcButton label="5" type="number" onPress={handlePress} />
                    <CalcButton label="6" type="number" onPress={handlePress} />
                    <CalcButton label="-" type="operator" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <CalcButton label="1" type="number" onPress={handlePress} />
                    <CalcButton label="2" type="number" onPress={handlePress} />
                    <CalcButton label="3" type="number" onPress={handlePress} />
                    <CalcButton label="+" type="operator" onPress={handlePress} />
                </View>
                <View style={styles.row}>
                    <CalcButton label="0" type="number" onPress={handlePress} isDouble />
                    <CalcButton label="." type="number" onPress={handlePress} />
                    <CalcButton label="=" type="operator" onPress={handlePress} />
                </View>
            </View>

            {/* Action Bar */}
            <TouchableOpacity style={styles.pushBtn} activeOpacity={0.8} onPress={handlePushToSub}>
                <CalcIcon color="#10B981" size={20} />
                <Text style={styles.pushBtnText}>Apply to Subscription</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    displayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingVertical: 16,
    },
    displayText: {
        color: '#FFF',
    },
    keypad: {
        gap: 16,
        paddingBottom: 24,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'space-between',
    },
    buttonContainer: {
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        justifyContent: 'center',
    },
    buttonInner: {
        flex: 1,
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 32,
    },
    pushBtn: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        gap: 12,
    },
    pushBtnText: {
        color: '#10B981',
        fontSize: 16,
    },
});
