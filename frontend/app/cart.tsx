import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../src/components/AppHeader';
import { useCartStore } from '../src/store/cartStore';
import { useLanguageStore } from '../src/store/languageStore';

const placeholderImages: Record<string, string> = {
    'Hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    'T-Shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'Pants': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
    'Jackets': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
};

export default function CartScreen() {
    const insets = useSafeAreaInsets();
    const { items, total, updateQuantity, removeItem } = useCartStore();
    const language = useLanguageStore((state) => state.language);

    const handleQuantityChange = (productId: string, size: string, color: string, delta: number, currentQty: number) => {
        const newQty = currentQty + delta;
        if (newQty < 1) {
            removeItem(productId, size, color);
        } else {
            updateQuantity(productId, size, color, newQty);
        }
    };

    const getProductName = (item: any) => {
        if (item.product?.translations?.[language]?.name) {
            return item.product.translations[language].name;
        }
        return item.product?.name || 'Product';
    };

    const getProductImage = (item: any) => {
        // Check for multiple images first
        if (item.product?.images && item.product.images.length > 0) {
            return { uri: item.product.images[0] };
        }
        // Fallback to single image
        if (item.product?.image && item.product.image.startsWith('data:')) {
            return { uri: item.product.image };
        }
        if (item.product?.image) {
            return { uri: item.product.image };
        }
        const category = item.product?.category || 'T-Shirts';
        return { uri: placeholderImages[category] || placeholderImages['T-Shirts'] };
    };

    return (
        <View style={styles.container}>
            <AppHeader showBack />

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => router.push('/shop')}
                    >
                        <Text style={styles.shopButtonText}>Browse items</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {items.map((item, index) => (
                            <View key={`${item.product_id}-${item.size}-${item.color}-${index}`} style={styles.cartItem}>
                                <Image
                                    source={getProductImage(item)}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>
                                        {getProductName(item)}
                                    </Text>
                                    <Text style={styles.itemDetails}>
                                        {item.size} / {item.color}
                                    </Text>
                                    <Text style={styles.itemPrice}>
                                        ${(item.product?.price || 0).toFixed(2)}
                                    </Text>

                                    <View style={styles.quantityRow}>
                                        <View style={styles.quantityControls}>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() => handleQuantityChange(item.product_id, item.size, item.color, -1, item.quantity)}
                                            >
                                                <Text style={styles.quantityButtonText}>−</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() => handleQuantityChange(item.product_id, item.size, item.color, 1, item.quantity)}
                                            >
                                                <Text style={styles.quantityButtonText}>+</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => removeItem(item.product_id, item.size, item.color)}
                                        >
                                            <Text style={styles.removeText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Bottom Bar */}
                    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={() => router.push('/checkout')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.checkoutButtonText}>Checkout</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
        marginBottom: 20,
    },
    shopButton: {
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    shopButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    cartItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemImage: {
        width: 80,
        height: 100,
        backgroundColor: '#F5F5F5',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    itemDetails: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        marginBottom: 6,
    },
    itemPrice: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        marginBottom: 12,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quantityButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    quantityButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#000',
    },
    quantityText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        minWidth: 30,
        textAlign: 'center',
    },
    removeText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        textDecorationLine: 'underline',
    },
    bottomBar: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
        textTransform: 'uppercase',
    },
    totalAmount: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 16,
        color: '#000',
    },
    checkoutButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        alignItems: 'center',
    },
    checkoutButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
