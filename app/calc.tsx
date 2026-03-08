import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator } from '../components/Calculator';

export default function CalculatorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <X color="#FFF" size={24} />
                </TouchableOpacity>
            </View>
            <Calculator />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
