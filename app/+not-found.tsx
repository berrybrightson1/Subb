import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View style={styles.container}>
                <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

                <Link href="/" style={styles.link}>
                    <Text style={styles.linkText}>Go to home screen!</Text>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#0F0F13',
    },
    title: {
        fontSize: 20,
        color: '#fff',
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: '#A855F7',
    },
});
