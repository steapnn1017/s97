import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Platform,
    Alert,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const categories = ['Hoodies', 'T-Shirts', 'Pants', 'Jackets'];

export default function AdminScreen() {
    const insets = useSafeAreaInsets();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        category: 'T-Shirts',
        sizes: 'S,M,L,XL',
        colors: 'Black,White',
        images: [] as string[],
    });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const authStatus = await AsyncStorage.getItem('admin_logged_in');
        if (authStatus === 'true') {
            setIsLoggedIn(true);
            fetchProducts();
        }
        setCheckingAuth(false);
    };

    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            setLoginError('Please fill in all fields');
            return;
        }

        setLoggingIn(true);
        setLoginError('');

        // Hardcoded credentials check
        if (loginForm.username === 'admin' && loginForm.password === 'admin1017') {
            await AsyncStorage.setItem('admin_logged_in', 'true');
            setIsLoggedIn(true);
            fetchProducts();
        } else {
            setLoginError('Invalid username or password');
        }

        setLoggingIn(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('admin_logged_in');
        setIsLoggedIn(false);
        setLoginForm({ username: '', password: '' });
    };

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

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setForm({
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                category: product.category,
                sizes: product.sizes.join(','),
                colors: product.colors.join(','),
                images: product.images || (product.image ? [product.image] : []),
            });
        } else {
            setEditingProduct(null);
            setForm({
                name: '',
                description: '',
                price: '',
                category: 'T-Shirts',
                sizes: 'S,M,L,XL',
                colors: 'Black,White',
                images: [],
            });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingProduct(null);
    };

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets
                .filter(asset => asset.base64)
                .map(asset => `data:image/jpeg;base64,${asset.base64}`);

            setForm(prev => ({
                ...prev,
                images: [...prev.images, ...newImages].slice(0, 5) // Max 5 images
            }));
        }
    };

    const removeImage = (index: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.description.trim() || !form.price.trim()) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setSaving(true);
        try {
            const productData = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: parseFloat(form.price),
                category: form.category,
                sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
                colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
                images: form.images,
                image: form.images[0] || null, // Keep legacy field for compatibility
            };

            const url = editingProduct
                ? `${API_URL}/api/products/${editingProduct.id}`
                : `${API_URL}/api/products`;

            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!response.ok) throw new Error('Failed to save');

            Alert.alert('Success', editingProduct ? 'Product updated' : 'Product created');
            closeModal();
            fetchProducts();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (product: Product) => {
        Alert.alert(
            'Delete Product',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/api/products/${product.id}`, {
                                method: 'DELETE',
                            });
                            fetchProducts();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete');
                        }
                    },
                },
            ]
        );
    };

    // Show loading while checking auth
    if (checkingAuth) {
        return (
            <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    }

    // Show login form if not logged in
    if (!isLoggedIn) {
        return (
            <KeyboardAvoidingView
                style={[styles.container, { paddingTop: insets.top }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.loginHeader}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginTitle}>Admin Panel</Text>
                    <Text style={styles.loginSubtitle}>Enter your credentials</Text>

                    {loginError ? (
                        <Text style={styles.loginError}>{loginError}</Text>
                    ) : null}

                    <View style={styles.loginForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Username</Text>
                            <TextInput
                                style={styles.input}
                                value={loginForm.username}
                                onChangeText={(v) => setLoginForm(p => ({ ...p, username: v }))}
                                placeholder="Username"
                                placeholderTextColor="#CCC"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={loginForm.password}
                                onChangeText={(v) => setLoginForm(p => ({ ...p, password: v }))}
                                placeholder="Password"
                                placeholderTextColor="#CCC"
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loggingIn}
                        >
                            {loggingIn ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Admin panel (logged in)
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={22} color="#000" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.pageTitle}>SIERRA 97 SX</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Add Product Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>

            {/* Products List */}
            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="small" color="#000" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {products.map((product) => (
                        <View key={product.id} style={styles.productItem}>
                            <View style={styles.productImageContainer}>
                                {(product.images?.[0] || product.image) ? (
                                    <Image
                                        source={{ uri: product.images?.[0] || product.image }}
                                        style={styles.productImage}
                                    />
                                ) : (
                                    <View style={styles.productImagePlaceholder} />
                                )}
                                {product.images && product.images.length > 1 && (
                                    <View style={styles.imageCount}>
                                        <Text style={styles.imageCountText}>{product.images.length}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <Text style={styles.productMeta}>{product.category}</Text>
                                <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                            </View>
                            <View style={styles.productActions}>
                                <TouchableOpacity onPress={() => openModal(product)}>
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(product)}>
                                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeModal}>
                            <Text style={styles.modalNavLink}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingProduct ? 'Edit' : 'New Product'}
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text style={styles.modalNavLink}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Image Picker */}
                        <View style={styles.imagesSection}>
                            <Text style={styles.formLabel}>Images (up to 5)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.imagesRow}>
                                    {form.images.map((img, index) => (
                                        <View key={index} style={styles.imageThumb}>
                                            <Image source={{ uri: img }} style={styles.thumbImage} />
                                            <TouchableOpacity
                                                style={styles.removeImageBtn}
                                                onPress={() => removeImage(index)}
                                            >
                                                <Ionicons name="close-circle" size={22} color="#000" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {form.images.length < 5 && (
                                        <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                                            <Ionicons name="add" size={28} color="#999" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Name *</Text>
                            <TextInput
                                style={styles.formInput}
                                value={form.name}
                                onChangeText={(v) => setForm(p => ({ ...p, name: v }))}
                                placeholder="Product name"
                                placeholderTextColor="#CCC"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Description *</Text>
                            <TextInput
                                style={[styles.formInput, styles.textArea]}
                                value={form.description}
                                onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
                                placeholder="Description"
                                placeholderTextColor="#CCC"
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Price *</Text>
                            <TextInput
                                style={styles.formInput}
                                value={form.price}
                                onChangeText={(v) => setForm(p => ({ ...p, price: v }))}
                                placeholder="0.00"
                                placeholderTextColor="#CCC"
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryButtons}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryButton,
                                                form.category === cat && styles.categoryButtonActive,
                                            ]}
                                            onPress={() => setForm(p => ({ ...p, category: cat }))}
                                        >
                                            <Text style={[
                                                styles.categoryButtonText,
                                                form.category === cat && styles.categoryButtonTextActive,
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Sizes (comma separated)</Text>
                            <TextInput
                                style={styles.formInput}
                                value={form.sizes}
                                onChangeText={(v) => setForm(p => ({ ...p, sizes: v }))}
                                placeholder="S,M,L,XL"
                                placeholderTextColor="#CCC"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Colors (comma separated)</Text>
                            <TextInput
                                style={styles.formInput}
                                value={form.colors}
                                onChangeText={(v) => setForm(p => ({ ...p, colors: v }))}
                                placeholder="Black,White"
                                placeholderTextColor="#CCC"
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Login styles
    loginHeader: {
        padding: 16,
    },
    loginContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    loginTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 24,
        color: '#000',
        marginBottom: 8,
    },
    loginSubtitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
        marginBottom: 32,
    },
    loginError: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#E74C3C',
        marginBottom: 16,
    },
    loginForm: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#000',
    },
    loginButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    loginButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Admin panel styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 52,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        position: 'relative',
    },
    headerButton: {
        minWidth: 50,
        zIndex: 1,
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
    logoutText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#999',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        marginHorizontal: 16,
        marginVertical: 16,
        paddingVertical: 14,
        gap: 8,
    },
    addButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#FFF',
        letterSpacing: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    productImageContainer: {
        width: 60,
        height: 75,
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E8E8E8',
    },
    imageCount: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#000',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    imageCountText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#FFF',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        color: '#000',
        textTransform: 'uppercase',
    },
    productMeta: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    productPrice: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
        marginTop: 4,
    },
    productActions: {
        gap: 12,
    },
    actionText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
    },
    deleteText: {
        color: '#E74C3C',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalNavLink: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#000',
    },
    modalTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        color: '#000',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    imagesSection: {
        marginBottom: 24,
    },
    imagesRow: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
    },
    imageThumb: {
        width: 80,
        height: 100,
        position: 'relative',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 11,
    },
    addImageBtn: {
        width: 80,
        height: 100,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 14,
        color: '#000',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categoryButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
    },
    categoryButtonActive: {
        borderColor: '#000',
        backgroundColor: '#000',
    },
    categoryButtonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 11,
        color: '#000',
    },
    categoryButtonTextActive: {
        color: '#FFF',
    },
});
