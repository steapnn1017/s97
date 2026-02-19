import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppHeader } from '../src/components/AppHeader';
import { useLanguageStore } from '../src/store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    images?: string[];
    translations?: Record<string, { name: string; description: string }>;
}

const placeholderImages = [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
];

const categories = ['All', 'Hoodies', 'T-Shirts', 'Pants', 'Jackets'];

export default function ShopScreen() {
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(
        (params.category as string) || 'All'
    );
    const language = useLanguageStore((state) => state.language);

    const productWidth = (width - 48) / 2;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/products`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const getProductImage = (product: Product, index: number) => {
        if (product.images && product.images.length > 0) {
            return { uri: product.images[0] };
        }
        if (product.image && product.image.startsWith('data:')) {
            return { uri: product.image };
        }
        if (product.image) {
            return { uri: product.image };
        }
        return { uri: placeholderImages[index % placeholderImages.length] };
    };

    const getProductName = (product: Product) => {
        return product.translations?.[language]?.name || product.name;
    };

    return (
        <View style={styles.container}>
            <AppHeader />

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        style={styles.categoryButton}
                    >
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === category && styles.categoryTextActive,
                        ]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Products Grid */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#000" />
                    </View>
                ) : filteredProducts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No items available</Text>
                    </View>
                ) : (
                    <View style={styles.productsGrid}>
                        {filteredProducts.map((product, index) => (
                            <TouchableOpacity
                                key={product.id}
                                style={[styles.productItem, { width: productWidth }]}
                                onPress={() => router.push(`/product/${product.id}`)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.productImageContainer}>
                                    <Image
                                        source={getProductImage(product, index)}
                                        style={styles.productImage}
                                        resizeMode="contain"  // Udržuje proporce obrázku
                                    />
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={1}>
                                        {getProductName(product)}
                                    </Text>
                                    <Text style={styles.productPrice}>
                                        ${product.price.toFixed(2)}
                                    </Text>
                                    {/* Přidáme text "Add to cart" pod cenovku */}
                                    <Text style={styles.addToCartText}>Add to cart</Text>
                                </View>
                            </TouchableOpacity>
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
    categoryScroll: {
        maxHeight: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    categoryContent: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 24,
    },
    categoryButton: {
        marginRight: 24,
    },
    categoryText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
    },
    categoryTextActive: {
        color: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
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
    },
    emptyText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    productItem: {
        marginBottom: 20,
    },
    productImageContainer: {
        width: '100%',
        height: 180,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain', // Zachování proporcí obrázku
    },
    productInfo: {
        gap: 4,
    },
    productName: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productPrice: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#666',
    },
    addToCartText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
        marginTop: 5,
    },
});