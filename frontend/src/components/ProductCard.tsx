import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useLanguageStore } from '../store/languageStore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  translations?: Record<string, { name: string; description: string }>;
}

interface ProductCardProps {
  product: Product;
}

// Placeholder images for products without images
const placeholderImages: Record<string, string> = {
  'Hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
  'T-Shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'Pants': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
  'Jackets': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const language = useLanguageStore((state) => state.language);
  
  // Get translated name or fallback to default
  const displayName = product.translations?.[language]?.name || product.name;
  
  const imageSource = product.image 
    ? (product.image.startsWith('data:') ? { uri: product.image } : { uri: product.image })
    : { uri: placeholderImages[product.category] || placeholderImages['T-Shirts'] };

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    paddingVertical: 12,
  },
  name: {
    fontFamily: Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black',
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  price: {
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
