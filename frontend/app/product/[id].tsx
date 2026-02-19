import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
    Alert,
    Dimensions,
    FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { useCartStore } from '../../src/store/cartStore';
import { useLanguageStore } from '../../src/store/languageStore';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    images?: string[];
    sizes: string[];
    colors: string[];
    translations?: Record<string, { name: string; description: string }>;
}

const placeholderImages: Record<string, string> = {
    'Hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    'T-Shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'Pants': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    'Jackets': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [addingToCart, setAddingToCart] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const addItem = useCartStore((state) => state.addItem);
    const language = useLanguageStore((state) => state.language);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${API_URL}/api/products/${id}`);
            const data = await response.json();
            setProduct(data);
            if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
            if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product || !selectedSize || !selectedColor) return;

        setAddingToCart(true);
        await addItem({
            product_id: product.id,
            quantity: 1,
            size: selectedSize,
            color: selectedColor,
        });
        setAddingToCart(false);

        Alert.alert('Added to cart', '', [
            { text: 'Continue', onPress: () => router.back() },
            { text: 'View Cart', onPress: () => router.push('/cart') },
        ]);
    };

    const getProductImages = (): string[] => {
        if (!product) return [];
        if (product.images && product.images.length > 0) {
            return product.images;
        }
        if (product.image) {
            return [product.image];
        }
        return [placeholderImages[product.category] || placeholderImages['T-Shirts']];
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentImageIndex(viewableItems[0].index);
        }
    }).current;

    if (loading) {
        return (
            <View style={styles.container}>
                <AppHeader showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#000" />
                </View>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.container}>
                <AppHeader showBack />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Product not found</Text>
                </View>
            </View>
        );
    }

    const displayName = product.translations?.[language]?.name || product.name;
    const displayDescription = product.translations?.[language]?.description || product.description;
    const images = getProductImages();

    return (
        <View style={styles.container}>
            <AppHeader showBack />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Image Carousel */}
                <View style={styles.imageSection}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: item }}
                                    style={styles.productImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    />

                    {/* Image Indicators */}
                    {images.length > 1 && (
                        <View style={styles.indicators}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicator,
                                        currentImageIndex === index && styles.indicatorActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName}>{displayName}</Text>
                    <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>

                    {/* Size Selection */}
                    <View style={styles.optionSection}>
                        <Text style={styles.optionLabel}>Size</Text>
                        <View style={styles.optionButtons}>
                            {product.sizes.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.optionButton,
                                        selectedSize === size && styles.optionButtonActive,
                                    ]}
                                    onPress={() => setSelectedSize(size)}
                                >
                                    <Text style={[
                                        styles.optionButtonText,
                                        selectedSize === size && styles.optionButtonTextActive,
                                    ]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Color Selection */}
                    <View style={styles.optionSection}>
                        <Text style={styles.optionLabel}>Color</Text>
                        <View style={styles.optionButtons}>
                            {product.colors.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.optionButton,
                                        selectedColor === color && styles.optionButtonActive,
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    <Text style={[
                                        styles.optionButtonText,
                                        selectedColor === color && styles.optionButtonTextActive,
                                    ]}>
                                        {color}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>{displayDescription}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                    disabled={addingToCart}
                    activeOpacity={0.8}
                >
                    {addingToCart ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const IMAGE_WIDTH = width;
const IMAGE_HEIGHT = width * 0.5; // Compact height for product display

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    imageSection: {
        position: 'relative',
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        backgroundColor: '#F5F5F5',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    indicators: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    indicatorActive: {
        backgroundColor: '#000',
    },
    infoContainer: {
        padding: 20,
    },
    productName: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    productPrice: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#666',
        marginBottom: 28,
    },
    optionSection: {
        marginBottom: 24,
    },
    optionLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    optionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    optionButtonActive: {
        borderColor: '#000',
        backgroundColor: '#000',
    },
    optionButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
    },
    optionButtonTextActive: {
        color: '#FFF',
    },
    descriptionSection: {
        marginTop: 16,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    descriptionText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#666',
        lineHeight: 20,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    addToCartButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addToCartText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
