import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    Alert,
    KeyboardAvoidingView,
    Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../src/store/cartStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface ShippingForm {
    full_name: string;
    email: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
}

export default function CheckoutScreen() {
    const insets = useSafeAreaInsets();
    const { sessionId, total, items } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<ShippingForm>({
        full_name: '',
        email: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        phone: '',
    });
    const [errors, setErrors] = useState<Partial<ShippingForm>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<ShippingForm> = {};

        if (!form.full_name.trim()) newErrors.full_name = 'Required';
        if (!form.email.trim()) {
            newErrors.email = 'Required';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Invalid email';
        }
        if (!form.address.trim()) newErrors.address = 'Required';
        if (!form.city.trim()) newErrors.city = 'Required';
        if (!form.postal_code.trim()) newErrors.postal_code = 'Required';
        if (!form.country.trim()) newErrors.country = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckout = async () => {
        if (!validateForm()) return;
        if (items.length === 0) {
            Alert.alert('Error', 'Your cart is empty');
            return;
        }

        setLoading(true);
        try {
            const originUrl = typeof window !== 'undefined'
                ? window.location.origin
                : API_URL;

            const response = await fetch(`${API_URL}/api/checkout/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    shipping_info: form,
                    origin_url: originUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const data = await response.json();

            if (data.url) {
                if (Platform.OS === 'web') {
                    window.location.href = data.url;
                } else {
                    const supported = await Linking.canOpenURL(data.url);
                    if (supported) {
                        await Linking.openURL(data.url);
                    } else {
                        Alert.alert('Error', 'Cannot open payment page');
                    }
                }
            }
        } catch (error) {
            console.error('Checkout error:', error);
            Alert.alert('Error', 'Failed to process checkout');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: keyof ShippingForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.navLink}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.pageTitle}>SIERRA 97 SX</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.divider} />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* Order Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Order Total</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>

                <View style={styles.dividerFull} />

                {/* Shipping Form */}
                <Text style={styles.sectionLabel}>Shipping Information</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                        style={[styles.input, errors.full_name && styles.inputError]}
                        value={form.full_name}
                        onChangeText={(v) => updateField('full_name', v)}
                        placeholder="Full name"
                        placeholderTextColor="#CCC"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        value={form.email}
                        onChangeText={(v) => updateField('email', v)}
                        placeholder="Email address"
                        placeholderTextColor="#CCC"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Address</Text>
                    <TextInput
                        style={[styles.input, errors.address && styles.inputError]}
                        value={form.address}
                        onChangeText={(v) => updateField('address', v)}
                        placeholder="Street address"
                        placeholderTextColor="#CCC"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput
                            style={[styles.input, errors.city && styles.inputError]}
                            value={form.city}
                            onChangeText={(v) => updateField('city', v)}
                            placeholder="City"
                            placeholderTextColor="#CCC"
                        />
                    </View>
                    <View style={styles.spacer} />
                    <View style={[styles.inputGroup, styles.flex1]}>
                        <Text style={styles.inputLabel}>Postal Code</Text>
                        <TextInput
                            style={[styles.input, errors.postal_code && styles.inputError]}
                            value={form.postal_code}
                            onChangeText={(v) => updateField('postal_code', v)}
                            placeholder="Zip"
                            placeholderTextColor="#CCC"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TextInput
                        style={[styles.input, errors.country && styles.inputError]}
                        value={form.country}
                        onChangeText={(v) => updateField('country', v)}
                        placeholder="Country"
                        placeholderTextColor="#CCC"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        onChangeText={(v) => updateField('phone', v)}
                        placeholder="Phone number"
                        placeholderTextColor="#CCC"
                        keyboardType="phone-pad"
                    />
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.payButton, loading && styles.payButtonDisabled]}
                    onPress={handleCheckout}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.payButtonText}>Pay ${total.toFixed(2)}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        position: 'relative',
    },
    backButton: {
        zIndex: 1,
    },
    navLink: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#000',
    },
    logoContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#000',
        letterSpacing: 1.5,
    },
    placeholder: {
        width: 50,
    },
    divider: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginHorizontal: 16,
    },
    dividerFull: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginVertical: 24,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    summarySection: {
        marginBottom: 8,
    },
    sectionLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    totalAmount: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 24,
        color: '#000',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#000',
    },
    inputError: {
        borderColor: '#E74C3C',
    },
    row: {
        flexDirection: 'row',
    },
    flex1: {
        flex: 1,
    },
    spacer: {
        width: 12,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    payButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    payButtonDisabled: {
        backgroundColor: '#666',
    },
    payButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
