import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    Modal,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { Language } from '../i18n/translations';

const { width } = Dimensions.get('window');

const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'cs', name: 'Čeština', flag: 'https://flagcdn.com/w40/cz.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
    { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
];

interface AppHeaderProps {
    showBack?: boolean;
    title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ showBack, title }) => {
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

    return (
        <>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    {showBack ? (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerButton}
                        >
                            <Ionicons name="arrow-back" size={22} color="#000" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setMenuOpen(true)}
                            style={styles.headerButton}
                        >
                            <Ionicons name="menu" size={22} color="#000" />
                        </TouchableOpacity>
                    )}

                    {/* Centered Logo */}
                    <View style={styles.logoContainer}>
                        <TouchableOpacity onPress={() => router.push('/')}>
                            <Text style={styles.logo}>{title || 'SIERRA 97 SX'}</Text>
                        </TouchableOpacity>
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
            </View>

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
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 52,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
    logoContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
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
        width: 24,
        height: 16,
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
