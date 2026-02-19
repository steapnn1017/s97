import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../src/store/cartStore';
import { useLanguageStore } from '../src/store/languageStore';
import { Language } from '../src/i18n/translations';

const { width } = Dimensions.get('window');

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'cs', name: 'Čeština', flag: 'https://flagcdn.com/w40/cz.png' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { language, setLanguage } = useLanguageStore();

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleLanguageChange = async (code: Language) => {
    await setLanguage(code);
    setLangOpen(false);
  };

  const openSocial = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setMenuOpen(true)}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={22} color="#000" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>SIERRA 97 SX</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setLangOpen(true)}
            style={styles.langButton}
          >
            <Image 
              source={{ uri: currentLang.flag }} 
              style={styles.flagImage}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/cart')}
            style={styles.headerButton}
          >
            <Ionicons name="bag-outline" size={20} color="#000" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.heroImageContainer}
            onPress={() => router.push('/shop')}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: 'https://images.complex.com/complex/image/upload/v1730951310/CS_BrandArtist_Desktop_Destroy_Lonely_21x9.png' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Shop Now Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/shop')}
            activeOpacity={0.8}
          >
            <Text style={styles.shopButtonText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Philosophy */}
        <View style={styles.philosophySection}>
          <View style={styles.divider} />
          <Text style={styles.philosophyQuote}>
            "We don't follow trends.{'\n'}We exist outside of time."
          </Text>
          <Text style={styles.philosophyText}>
            SIERRA 97 SX is more than clothing. It's a statement of individuality 
            in a world of conformity. Born from the streets, crafted for those 
            who refuse to blend in. Every piece tells a story of rebellion, 
            authenticity, and the relentless pursuit of self-expression.
          </Text>
          <Text style={styles.philosophyTagline}>
            Wear your truth.
          </Text>
        </View>

        {/* Social Links */}
        <View style={styles.socialSection}>
          <Text style={styles.socialLabel}>FOLLOW US</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => openSocial('https://instagram.com')}
            >
              <Ionicons name="logo-instagram" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => openSocial('https://twitter.com')}
            >
              <Ionicons name="logo-twitter" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => openSocial('https://tiktok.com')}
            >
              <Ionicons name="logo-tiktok" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialIcon}
              onPress={() => openSocial('https://youtube.com')}
            >
              <Ionicons name="logo-youtube" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>SIERRA 97 SX</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text style={styles.footerLink}>Shop</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/cart')}>
              <Text style={styles.footerLink}>Cart</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/admin')}>
              <Text style={styles.footerLink}>Admin</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerCopy}>© 2026 SIERRA 97 SX. All rights reserved.</Text>
          <Text style={styles.footerTagline}>EST. 1997 — Prague, CZ</Text>
        </View>
      </ScrollView>

      {/* Burger Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={[styles.menuContainer, { paddingTop: insets.top + 16 }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuLogo}>SIERRA 97 SX</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/'); }}
              >
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/shop'); }}
              >
                <Text style={styles.menuItemText}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/cart'); }}
              >
                <Text style={styles.menuItemText}>Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/orders'); }}
              >
                <Text style={styles.menuItemText}>My Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); router.push('/admin'); }}
              >
                <Text style={styles.menuItemText}>Admin Panel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selector Modal */}
      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangOpen(false)}
        >
          <View style={[styles.langModal, { top: insets.top + 60 }]}>
            <Text style={styles.langModalTitle}>Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  language === lang.code && styles.langOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Image 
                  source={{ uri: lang.flag }} 
                  style={styles.langOptionFlag}
                />
                <Text style={[
                  styles.langOptionText,
                  language === lang.code && styles.langOptionTextActive,
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={18} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    fontWeight: '400',
    color: '#000',
    letterSpacing: 1.5,
  },
  langButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagImage: {
    width: 20,
    height: 14,
    borderRadius: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#000',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  heroImageContainer: {
    width: '100%',
    aspectRatio: 21/9,
    backgroundColor: '#F5F5F5',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  shopButton: {
    backgroundColor: '#000',
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  shopButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#FFF',
    letterSpacing: 2,
  },
  philosophySection: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#000',
    marginBottom: 32,
  },
  philosophyQuote: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    color: '#000',
    lineHeight: 28,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  philosophyText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  philosophyTagline: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#000',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  socialSection: {
    paddingVertical: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  socialLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 16,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 24,
  },
  socialIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 22,
  },
  footer: {
    backgroundColor: '#000',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLogo: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerLink: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#888',
  },
  footerDot: {
    color: '#444',
    marginHorizontal: 12,
  },
  footerCopy: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#555',
    marginBottom: 8,
  },
  footerTagline: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#444',
    letterSpacing: 1,
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    width: width * 0.8,
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLogo: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
    letterSpacing: 1,
  },
  menuItems: {
    paddingTop: 24,
  },
  menuItem: {
    paddingVertical: 16,
  },
  menuItemText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 15,
    color: '#000',
    letterSpacing: 0.5,
  },
  // Language Modal
  langModal: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  langModalTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#999',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
  },
  langOptionActive: {
    backgroundColor: '#F5F5F5',
  },
  langOptionFlag: {
    width: 20,
    height: 14,
    borderRadius: 2,
    marginRight: 12,
  },
  langOptionText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#666',
  },
  langOptionTextActive: {
    color: '#000',
  },
});
