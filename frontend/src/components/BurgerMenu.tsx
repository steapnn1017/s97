import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import i18n from '../i18n/i18n';
import { useCartStore } from '../store/cartStore';

interface BurgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((state) => state.getItemCount());
  const slideAnim = React.useRef(new Animated.Value(-width)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    { key: 'home', icon: 'home-outline' as const, route: '/' },
    { key: 'shop', icon: 'shirt-outline' as const, route: '/shop' },
    { key: 'cart', icon: 'cart-outline' as const, route: '/cart', badge: itemCount },
    { key: 'admin', icon: 'settings-outline' as const, route: '/admin' },
    { key: 'settings', icon: 'language-outline' as const, route: '/settings' },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.menuContainer,
            { 
              paddingTop: insets.top + 20,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.brandName}>SIERRA 97 SX</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons name={item.icon} size={24} color="#000" />
                  <Text style={styles.menuItemText}>
                    {i18n.t(item.key as any)}
                  </Text>
                </View>
                {item.badge && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 SIERRA 97 SX</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  brandName: {
    fontFamily: Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black',
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    flex: 1,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black',
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: '#000',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
