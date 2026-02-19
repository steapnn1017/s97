import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../src/store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function CheckoutSuccessScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const sessionId = params.session_id as string;
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const fetchCart = useCartStore((state) => state.fetchCart);

    useEffect(() => {
        if (sessionId) {
            pollPaymentStatus();
        } else {
            setStatus('error');
        }
    }, [sessionId]);

    const pollPaymentStatus = async (attempts = 0) => {
        const maxAttempts = 5;
        const pollInterval = 2000;

        if (attempts >= maxAttempts) {
            setStatus('success');
            await fetchCart();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/checkout/status/${sessionId}`);
            if (!response.ok) throw new Error('Failed to check status');

            const data = await response.json();
            setPaymentStatus(data.payment_status);

            if (data.payment_status === 'paid') {
                setStatus('success');
                await fetchCart();
                return;
            } else if (data.status === 'expired') {
                setStatus('error');
                return;
            }

            setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        } catch (error) {
            console.error('Error checking payment status:', error);
            setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header with centered logo */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>SIERRA 97 SX</Text>
                </View>
            </View>

            <View style={styles.content}>
                {status === 'loading' ? (
                    <>
                        <ActivityIndicator size="small" color="#000" />
                        <Text style={styles.loadingText}>Confirming payment...</Text>
                    </>
                ) : status === 'success' ? (
                    <>
                        <Text style={styles.checkmark}>✓</Text>
                        <Text style={styles.title}>Thank you</Text>
                        <Text style={styles.subtitle}>Your order has been confirmed</Text>
                        {paymentStatus === 'paid' && (
                            <Text style={styles.statusText}>Payment successful</Text>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.errorMark}>×</Text>
                        <Text style={styles.title}>Error</Text>
                        <Text style={styles.subtitle}>Something went wrong</Text>
                    </>
                )}

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Back to shop</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#000',
        letterSpacing: 1.5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    checkmark: {
        fontSize: 48,
        color: '#000',
        marginBottom: 24,
    },
    errorMark: {
        fontSize: 48,
        color: '#E74C3C',
        marginBottom: 24,
    },
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 18,
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#27AE60',
        marginBottom: 32,
    },
    loadingText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
        marginTop: 16,
    },
    button: {
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 32,
        paddingVertical: 14,
        marginTop: 32,
    },
    buttonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        letterSpacing: 0.5,
    },
});
