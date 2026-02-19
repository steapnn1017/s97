import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../src/store/cartStore';
import { AppHeader } from '../src/components/AppHeader';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Order {
    id: string;
    order_number: string;
    items: any[];
    subtotal: number;
    discount_amount?: number;
    shipping_cost: number;
    total: number;
    status: string;
    created_at: string;
    shipping_info: any;
}

export default function OrdersScreen() {
    const insets = useSafeAreaInsets();
    const { sessionId } = useCartStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            fetchOrders();
        }
    }, [sessionId]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/api/orders/session/${sessionId}`);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return '#27AE60';
            case 'pending':
                return '#F39C12';
            case 'cancelled':
                return '#E74C3C';
            default:
                return '#666';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid':
                return 'Completed';
            case 'pending':
                return 'Pending Payment';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={styles.pageTitle}>MY ORDERS</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#000" />
                    </View>
                ) : orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => router.push('/shop')}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.ordersContainer}>
                        {orders.map((order) => (
                            <View key={order.id} style={styles.orderCard}>
                                {/* Order Header */}
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderNumber}>
                                            {order.order_number}
                                        </Text>
                                        <Text style={styles.orderDate}>
                                            {formatDate(order.created_at)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(order.status) }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {getStatusText(order.status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Items */}
                                <View style={styles.itemsContainer}>
                                    {order.items.map((item, index) => (
                                        <View key={index} style={styles.orderItem}>
                                            {item.product?.image && (
                                                <Image
                                                    source={{ uri: item.product.image }}
                                                    style={styles.itemImage}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemName}>
                                                    {item.product?.name || 'Product'}
                                                </Text>
                                                <Text style={styles.itemDetails}>
                                                    Size: {item.size} | Color: {item.color}
                                                </Text>
                                                <Text style={styles.itemQuantity}>
                                                    Qty: {item.quantity}
                                                </Text>
                                            </View>
                                            <Text style={styles.itemPrice}>
                                                ${(item.product?.price * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Order Summary */}
                                <View style={styles.orderSummary}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                                        <Text style={styles.summaryValue}>
                                            ${order.subtotal.toFixed(2)}
                                        </Text>
                                    </View>
                                    {order.discount_amount && order.discount_amount > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={[styles.summaryLabel, styles.discountText]}>
                                                Discount:
                                            </Text>
                                            <Text style={[styles.summaryValue, styles.discountText]}>
                                                -${order.discount_amount.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Shipping:</Text>
                                        <Text style={styles.summaryValue}>
                                            ${order.shipping_cost.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total:</Text>
                                        <Text style={styles.totalValue}>
                                            ${order.total.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Shipping Info */}
                                {order.shipping_info && (
                                    <View style={styles.shippingInfo}>
                                        <Text style={styles.shippingLabel}>Shipping to:</Text>
                                        <Text style={styles.shippingText}>
                                            {order.shipping_info.full_name}
                                        </Text>
                                        <Text style={styles.shippingText}>
                                            {order.shipping_info.address}
                                        </Text>
                                        <Text style={styles.shippingText}>
                                            {order.shipping_info.city}, {order.shipping_info.postal_code}
                                        </Text>
                                        <Text style={styles.shippingText}>
                                            {order.shipping_info.country}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        letterSpacing: 1,
        marginBottom: 20,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#999',
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    shopButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ordersContainer: {
        gap: 16,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 16,
        marginBottom: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    orderNumber: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    orderDate: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemsContainer: {
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    itemImage: {
        width: 60,
        height: 60,
        backgroundColor: '#F5F5F5',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        marginBottom: 4,
    },
    itemDetails: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    itemQuantity: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#666',
    },
    itemPrice: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    orderSummary: {
        marginBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#666',
    },
    summaryValue: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
    },
    discountText: {
        color: '#27AE60',
    },
    totalRow: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    totalLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    totalValue: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    shippingInfo: {
        backgroundColor: '#F8F8F8',
        padding: 12,
    },
    shippingLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    shippingText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
        marginBottom: 2,
    },
});
