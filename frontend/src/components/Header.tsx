import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCartStore } from '../store/cartStore';

interface HeaderProps {
  onMenuPress: () => void;
  showBack?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuPress, showBack, title }) => {
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <Text style={styles.logo}>SIERRA 97 SX</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/cart')} 
          style={styles.iconButton}
        >
          <Ionicons name="cart-outline" size={26} color="#000" />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black',
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black',
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
