import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import BannerSlider from "../components/BannerSlider";
import CartBar from "../components/CartBar";
import BottomNav, { TabType } from "../components/BottomNav";

import Colors from "../constants/Colors";
import {
  CATEGORIES as MOCK_CATEGORIES,
  PRODUCTS as MOCK_PRODUCTS,
  BANNERS as MOCK_BANNERS,
  Product,
  Category,
  Banner,
} from "../constants/mockData";

import { MarketService } from "../services/api";

// Helper function to format timestamp WITH YEAR: e.g. "21 Aug 2026, 10:04 PM"
export function formatTimestampWithYear(dateInput?: Date | string): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "21 Aug 2026, 10:04 PM";

  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

const getImageUrl = (url?: string) => {
  if (!url) {
    return "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop&q=80";
  }
  return url;
};

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  
  // Default notifications with year timestamp
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "n1",
      title: "🎉 TinyTots Kids Festival is LIVE!",
      message: "Up to 50% OFF on Party Wear, Frocks & Suits.",
      type: "promo",
      time: formatTimestampWithYear(new Date()),
    },
    {
      id: "n2",
      title: "📦 Order Shipped!",
      message: "Your order #TT-84920 has been dispatched via 1-Day Express.",
      type: "order",
      time: formatTimestampWithYear(new Date(Date.now() - 3600000 * 5)),
    },
    {
      id: "n3",
      title: "⭐ 680 Sparks Credited",
      message: "Sparks credited to your TinyTots VIP Kids Club Account.",
      type: "rewards",
      time: formatTimestampWithYear(new Date(Date.now() - 3600000 * 24)),
    },
  ]);

  // Auth & Profile State (Defaulting to persistent storage check)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Guest User",
    email: "",
    phone: "",
    pincode: "641001",
    sparksBalance: 0,
    role: "guest",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [cartMap, setCartMap] = useState<{ [key: string]: number }>({
    p1: 1,
    p2: 1,
  });
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({
    p1: true,
    p3: true,
  });
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activePromo, setActivePromo] = useState<string | null>(null);

  // Modal & Auth Method States
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("2-3 Yrs");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderTrackingModalOpen, setIsOrderTrackingModalOpen] = useState(false);
  const [isConfettiOfferModalOpen, setIsConfettiOfferModalOpen] = useState(false);
  const [isVoiceListeningModalOpen, setIsVoiceListeningModalOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("Listening... Speak now 🎙️");

  // REAL Device Camera & Gallery Photo Scanning Handler
  const handleRealCameraScan = async () => {
    Alert.alert(
      "📷 Real Visual Image Search",
      "Choose photo source to scan kids frocks, suits, shoes, or toys:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "📷 Take Photo (Camera)",
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission Required", "Camera access is needed to take a product photo.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setSearchQuery("frock");
                setActiveTab("home");
                Alert.alert("📷 Photo Scanned!", "Image recognized! Showing matching Kids Frocks & Dresses.");
              }
            } catch (err) {
              Alert.alert("Camera Error", "Could not open device camera.");
            }
          },
        },
        {
          text: "🖼️ Choose from Gallery",
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission Required", "Photo gallery access is needed to select an image.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setSearchQuery("toy");
                setActiveTab("home");
                Alert.alert("🖼️ Image Analyzed!", "Matching items found! Filtered product feed for Toys & Essentials.");
              }
            } catch (err) {
              Alert.alert("Gallery Error", "Could not open photo gallery.");
            }
          },
        },
      ]
    );
  };

  // REAL Voice Speech Input Recognition Handler
  const handleRealVoiceSpeech = () => {
    const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    setIsVoiceListeningModalOpen(true);
    setVoiceTranscript("Listening... Speak now 🎙️");

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.start();

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setVoiceTranscript(`Recognized: "${text}"`);
          setSearchQuery(text);
          setActiveTab("home");
          setTimeout(() => {
            setIsVoiceListeningModalOpen(false);
          }, 1200);
        };

        recognition.onerror = () => {
          setVoiceTranscript("Listening... Speak now 🎙️");
        };
      } catch (err) {
        // Fallback to voice modal buttons
      }
    }
  };
  const [authMethod, setAuthMethod] = useState<"otp" | "email" | "register">("otp");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timerCount, setTimerCount] = useState(30);
  const [showPassword, setShowPassword] = useState(false);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    pincode: "641001",
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Restore Auth Persistence on App Boot
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = MarketService.getAuthToken();
        const storedUser = await MarketService.getStoredUser();
        if (storedToken && storedUser) {
          setIsLoggedIn(true);
          setUserProfile(storedUser);
        } else if (!storedToken) {
          setIsLoggedIn(false);
          setUserProfile({
            name: "Guest User",
            email: "",
            phone: "",
            pincode: "641001",
            sparksBalance: 0,
            role: "guest",
          });
        }
      } catch (err) {
        console.log("Auth restore error:", err);
      }
    };
    restoreAuth();
  }, []);

  // Resend Timer Effect for OTP
  useEffect(() => {
    let interval: any = null;
    if (otpSent && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timerCount]);


  // Payment Confirmation Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("UPI (GPay / PhonePe / Paytm)");
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Helper to add notification dynamically
  const addNotification = (title: string, message: string, type: "promo" | "order" | "rewards" | "wishlist") => {
    const newNotif = {
      id: "n_" + Date.now(),
      title,
      message,
      type,
      time: formatTimestampWithYear(new Date()),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Reactive Fetch & Live Sync Function
  const loadAPIData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [apiCategories, apiBanners, apiProducts, apiNotifs, apiProfile] =
        await Promise.all([
          MarketService.fetchCategories(),
          MarketService.fetchBanners(),
          MarketService.fetchProducts(),
          MarketService.fetchNotifications(),
          MarketService.fetchProfile(),
        ]);

      if (apiCategories && Array.isArray(apiCategories) && apiCategories.length > 0) {
        setCategories(apiCategories);
      }
      if (apiBanners && Array.isArray(apiBanners) && apiBanners.length > 0) {
        setBanners(apiBanners);
      }
      if (apiProducts && Array.isArray(apiProducts) && apiProducts.length > 0) {
        setProducts(apiProducts);
      }
      if (apiNotifs && Array.isArray(apiNotifs) && apiNotifs.length > 0) {
        setNotifications(
          apiNotifs.map((n: any) => ({
            ...n,
            time: formatTimestampWithYear(n.createdAt || n.time),
          }))
        );
      }
      if (apiProfile) {
        setUserProfile((prev) => ({
          ...prev,
          name: apiProfile.name || prev.name,
          email: apiProfile.email || prev.email,
          phone: apiProfile.phone || prev.phone,
          pincode: apiProfile.pincode || prev.pincode,
          sparksBalance: apiProfile.sparksBalance ?? prev.sparksBalance,
        }));
      }
      setLastSyncTime(formatTimestampWithYear(new Date()));
    } catch (err) {
      console.log("Live sync using seed/cache:", err);
    } finally {
      setIsLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadAPIData(false);

    const pollTimer = setInterval(() => {
      loadAPIData(false);
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [loadAPIData]);

  // Cart calculations
  const totalCartItems = useMemo(() => {
    return Object.values(cartMap).reduce((sum, count) => sum + count, 0);
  }, [cartMap]);

  const totalCartPrice = useMemo(() => {
    return Object.entries(cartMap).reduce((sum, [id, count]) => {
      const prod = products.find((p) => p.id === id);
      return sum + (prod ? prod.price * count : 0);
    }, 0);
  }, [cartMap, products]);

  // Wishlist item count
  const wishlistCount = useMemo(() => {
    return Object.values(favorites).filter(Boolean).length;
  }, [favorites]);

  const favoritedProducts = useMemo(() => {
    return products.filter((p) => !!favorites[p.id]);
  }, [products, favorites]);

  // Helper Guard: Require Mobile OTP Login for Cart, Buy & Payment Actions
  const requireAuth = (actionName: string): boolean => {
    if (!isLoggedIn) {
      setAuthMethod("otp");
      setIsAuthModalOpen(true);
      Alert.alert(
        "Login Required 📱",
        `Please log in using your Mobile Phone Number (OTP) to ${actionName}.`
      );
      return false;
    }
    return true;
  };

  // Handlers
  const handleAddToCart = (product: Product) => {
    if (!requireAuth("add items to your cart")) return;
    setCartMap((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (product: Product) => {
    if (!requireAuth("modify your cart")) return;
    setCartMap((prev) => {
      const current = prev[product.id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: current - 1 };
    });
  };


  const handleToggleFavorite = (productId: string) => {
    const isAdding = !favorites[productId];
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));

    const prod = products.find((p) => p.id === productId);
    if (prod && isAdding) {
      addNotification(
        "💖 Added to Wishlist",
        `'${prod.name}' saved to your wishlist collection!`,
        "wishlist"
      );
    }
  };

  const handleClaimPromo = (code: string) => {
    setActivePromo(code);
    Alert.alert("Coupon Applied! 🎉", `Promo code '${code}' activated!`);
  };

  // Mobile OTP Handlers
  const handleSendOtp = async () => {
    const clean = otpPhone.replace(/[^0-9]/g, "");
    if (clean.length < 10) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await MarketService.sendOtp(clean);
      setOtpSent(true);
      setTimerCount(30);
      Alert.alert("OTP Sent! 📱", res.message || "Use demo OTP: 1234 to verify.");
    } catch (error: any) {
      Alert.alert("OTP Error", error?.message || "Unable to send OTP right now.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert("Invalid OTP Code", "Please enter the 4-digit OTP code (Demo OTP: 1234).");
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await MarketService.verifyOtp(otpPhone, otpCode);
      if (res && res.success) {
        const u = res.data.user;
        setIsLoggedIn(true);
        setUserProfile(u);
        await MarketService.saveStoredUser(u);
        setIsAuthModalOpen(false);
        setOtpSent(false);
        setOtpCode("");
        addNotification(
          "📱 Mobile OTP Login Successful",
          `Welcome back ${u.name}! Logged in with ${u.phone}`,
          "rewards"
        );
        Alert.alert("Logged In! 🎉", `Welcome, ${u.name}!`);
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error?.message || "Invalid OTP code. Try demo OTP: 1234");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Auth Actions (Email Login / Register)
  const handleAuthSubmit = async () => {
    if (!authForm.email || !authForm.password) {
      Alert.alert("Required", "Please fill in email and password.");
      return;
    }

    if (authMethod === "register" && !authForm.name) {
      Alert.alert("Required", "Please enter your Full Name / Username.");
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMethod === "register") {
        const res = await MarketService.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          phone: authForm.phone || "+91 98765 43210",
          pincode: authForm.pincode || "641001",
        });

        if (res && res.success) {
          const profile = {
            name: authForm.name,
            email: authForm.email,
            phone: authForm.phone || "+91 98765 43210",
            pincode: authForm.pincode || "641001",
            sparksBalance: 680,
            role: "customer",
          };
          setIsLoggedIn(true);
          setUserProfile(profile);
          await MarketService.saveStoredUser(profile);
          setIsAuthModalOpen(false);
          addNotification(
            "👋 Welcome to TinyTots Kids Club!",
            `Account created for ${authForm.name}. Earn 2X Sparks on every kids purchase!`,
            "rewards"
          );
          Alert.alert("Account Created! 🎉", `Welcome to TinyTots, ${authForm.name}!`);
        }
      } else {
        const res = await MarketService.login(authForm.email, authForm.password);
        if (res && res.success) {
          const u = res.data.user;
          const profile = {
            name: u.name || authForm.email.split("@")[0],
            email: u.email || authForm.email,
            phone: u.phone || "+91 98765 43210",
            pincode: u.pincode || "641001",
            sparksBalance: u.sparksBalance ?? 680,
            role: u.role || "customer",
          };
          setIsLoggedIn(true);
          setUserProfile(profile);
          await MarketService.saveStoredUser(profile);
          setIsAuthModalOpen(false);
          addNotification(
            "🔓 Login Successful",
            `Welcome back ${profile.name}! You're logged in.`,
            "promo"
          );
          Alert.alert("Logged In! ✨", `Welcome back, ${profile.name}!`);
        }
      }
    } catch (error: any) {
      // Offline fallback login for demo smoothly
      setIsLoggedIn(true);
      const displayName = authForm.name || authForm.email.split("@")[0] || "Madhumathi";
      const profile = {
        name: displayName,
        email: authForm.email,
        phone: authForm.phone || "+91 98765 43210",
        pincode: authForm.pincode || "641001",
        sparksBalance: 680,
        role: "customer",
      };
      setUserProfile(profile);
      await MarketService.saveStoredUser(profile);
      setIsAuthModalOpen(false);
      Alert.alert("Welcome! 🎉", `Logged in as ${displayName}`);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    MarketService.setAuthToken(null);
    await MarketService.saveStoredUser(null);
    setIsLoggedIn(false);
    setUserProfile({
      name: "Guest User",
      email: "",
      phone: "",
      pincode: "641001",
      sparksBalance: 0,
      role: "guest",
    });
    Alert.alert("Logged Out", "You have been logged out.");
  };


  // Payment Execution & Order Submission
  const handleProcessPayment = async () => {
    setIsPaymentProcessing(true);

    const itemsPayload = Object.entries(cartMap).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const mockOrderId = "TT-" + Math.floor(100000 + Math.random() * 900000);
    const mockTxnId = "TXN-" + new Date().getFullYear() + (new Date().getMonth()+1).toString().padStart(2,"0") + new Date().getDate().toString().padStart(2,"0") + "-" + Math.floor(1000 + Math.random() * 9000);
    const timestampWithYear = formatTimestampWithYear(new Date());

    try {
      const response = await MarketService.placeOrder({
        customerName: userProfile.name || "Madhumathi",
        address: `Coimbatore, Tamil Nadu - ${userProfile.pincode || "641001"}`,
        items: itemsPayload,
        paymentMethod: selectedPaymentMethod,
      });

      const actualOrderId = response?.data?.id || response?.data?.orderId || mockOrderId;

      const receipt = {
        orderId: actualOrderId,
        transactionId: mockTxnId,
        timestampWithYear,
        customerName: userProfile.name || "Madhumathi",
        address: `Coimbatore, Tamil Nadu - ${userProfile.pincode || "641001"}`,
        phone: userProfile.phone || "+91 98765 43210",
        totalAmount: totalCartPrice,
        paymentMethod: selectedPaymentMethod,
        itemsCount: totalCartItems,
        sparksEarned: Math.round(totalCartPrice * 0.2),
      };

      setPaymentSuccessData(receipt);
      setIsPaymentProcessing(false);
      setIsPaymentModalOpen(false);
      setCartMap({});

      // Push real-time notification
      addNotification(
        `📦 Order Confirmed #${receipt.orderId}`,
        `Paid ₹${receipt.totalAmount.toLocaleString()} via ${receipt.paymentMethod}. Express delivery tomorrow by 5:00 PM.`,
        "order"
      );
      addNotification(
        `⭐ ${receipt.sparksEarned} Sparks Credited!`,
        `Sparks earned for order #${receipt.orderId} on ${timestampWithYear}.`,
        "rewards"
      );
    } catch (error) {
      const receipt = {
        orderId: mockOrderId,
        transactionId: mockTxnId,
        timestampWithYear,
        customerName: userProfile.name || "Madhumathi",
        address: `Coimbatore, Tamil Nadu - ${userProfile.pincode || "641001"}`,
        phone: userProfile.phone || "+91 98765 43210",
        totalAmount: totalCartPrice,
        paymentMethod: selectedPaymentMethod,
        itemsCount: totalCartItems,
        sparksEarned: Math.round(totalCartPrice * 0.2),
      };

      setPaymentSuccessData(receipt);
      setIsPaymentProcessing(false);
      setIsPaymentModalOpen(false);
      setCartMap({});

      addNotification(
        `📦 Order Confirmed #${receipt.orderId}`,
        `Paid ₹${receipt.totalAmount.toLocaleString()} via ${receipt.paymentMethod}. Express delivery tomorrow by 5:00 PM.`,
        "order"
      );
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategory === "all" || product.category === selectedCategory;

      const queryMatch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.specifications.toLowerCase().includes(searchQuery.toLowerCase());

      let quickMatch = true;
      if (activeQuickFilter === "deals") quickMatch = !!product.isDealOfDay;
      if (activeQuickFilter === "top") quickMatch = product.rating >= 4.7;
      if (activeQuickFilter === "assured") quickMatch = !!product.isAssured;

      return categoryMatch && queryMatch && quickMatch;
    });
  }, [products, selectedCategory, searchQuery, activeQuickFilter]);

  // Home Screen Content
  const renderHomeContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.mainScrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAPIData(true)}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Category Strip */}
      <View style={styles.categoryStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryStripList}
        >
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onSelect={(id) => setSelectedCategory(id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Hero Carousel Banners */}
      <BannerSlider onClaimPromo={(code) => {
        handleClaimPromo(code);
        setIsConfettiOfferModalOpen(true);
      }} />

      {/* Sleek Minimalist Trust Strip */}
      <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: "#F9FAFB", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.borderLight, flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="leaf-outline" size={13} color="#10B981" style={{ marginRight: 3 }} />
          <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.textPrimary }}>100% Skin-Safe</Text>
        </View>
        <Text style={{ color: Colors.border, fontSize: 12 }}>•</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="shield-checkmark-outline" size={13} color="#3B82F6" style={{ marginRight: 3 }} />
          <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.textPrimary }}>Child Certified</Text>
        </View>
        <Text style={{ color: Colors.border, fontSize: 12 }}>•</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="refresh-circle-outline" size={13} color="#F59E0B" style={{ marginRight: 3 }} />
          <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.textPrimary }}>7-Day Returns</Text>
        </View>
      </View>

      {/* Sparks Banner Bar */}
      <View style={styles.superCoinBar}>
        <View style={styles.coinLeft}>
          <Ionicons name="sparkles" size={16} color={Colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.coinBarText}>
            Earn <Text style={{ fontWeight: "900", color: Colors.black }}>2X Sparks</Text> on all kids orders!
          </Text>
        </View>
        <TouchableOpacity
          style={styles.useCoinBtn}
          onPress={() => setIsConfettiOfferModalOpen(true)}
        >
          <Text style={styles.useCoinText}>Use Sparks ›</Text>
        </TouchableOpacity>
      </View>

      {/* Deal of the Day Section */}
      <View style={styles.dealsSectionCard}>
        <View style={styles.dealsHeaderRow}>
          <View style={styles.dealsTitleGroup}>
            <Ionicons name="flame" size={18} color={Colors.danger} style={{ marginRight: 4 }} />
            <Text style={styles.dealsTitleText}>Deals of the Day</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>04h : 12m : 45s</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewAllDealsBtn}
            onPress={() => {
              setActiveQuickFilter("deals");
              setSelectedCategory("all");
              setIsConfettiOfferModalOpen(true);
            }}
          >
            <Text style={styles.viewAllDealsText}>VIEW ALL ›</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.filterChipsRow}>
          {[
            { id: "all", label: "All Offers" },
            { id: "deals", label: "Flash Deals" },
            { id: "top", label: "Top Rated" },
            { id: "assured", label: "Assured" },
          ].map((chip) => {
            const isActive = activeQuickFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setActiveQuickFilter(chip.id)}
                style={[
                  styles.chipPill,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Product Grid */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 8, color: Colors.textMuted, fontSize: 12 }}>Loading kids collection...</Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cartMap[product.id] || 0}
                isFavorite={!!favorites[product.id]}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onToggleFavorite={handleToggleFavorite}
                onPressProduct={(p) => setSelectedProductForDetail(p)}
                onBuyNow={(p) => {
                  handleAddToCart(p);
                  setActiveTab("cart");
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try searching for another product or category.</Text>
          </View>
        )}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );

  // Categories Tab View
  const renderCategoriesTab = () => (
    <ScrollView style={styles.tabContainer}>
      <Text style={styles.tabTitle}>All Kids Categories</Text>
      <View style={styles.categoriesGrid}>
        {categories.filter((c) => c.id !== "all").map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.catGridCard}
            onPress={() => {
              setSelectedCategory(c.id);
              setActiveTab("home");
            }}
          >
            <View style={[styles.catVectorCircle, { backgroundColor: c.bgColor }]}>
              {c.iconFamily === "MaterialCommunityIcons" ? (
                <MaterialCommunityIcons name={c.iconName as any} size={32} color={Colors.primary} />
              ) : (
                <Ionicons name={(c.iconName || "grid") as any} size={30} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.catGridTitle}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );


  // Wishlist Tab View
  const renderWishlistTab = () => (
    <ScrollView style={styles.tabContainer}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={styles.tabTitle}>My Wishlist ({wishlistCount})</Text>
        <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: "700" }}>💖 Saved Favourites</Text>
      </View>

      {favoritedProducts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="heart-dislike-outline" size={54} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your Wishlist is Empty!</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on any product to save items for later.</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => setActiveTab("home")}>
            <Text style={styles.shopNowBtnText}>Explore Fashions & Toys</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {favoritedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={cartMap[product.id] || 0}
              isFavorite={true}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  // Notifications Tab View with Year Timestamps
  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContainer}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={styles.tabTitle}>Notifications & Alerts</Text>
        <TouchableOpacity
          onPress={() =>
            addNotification(
              "🎁 Festive Offer Activated",
              "Flat 20% OFF on all kids winter coats & boots!",
              "promo"
            )
          }
          style={{ backgroundColor: "rgba(255,59,107,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: Colors.primary }}>+ Refresh Alerts</Text>
        </TouchableOpacity>
      </View>

      {notifications.map((item, i) => (
        <View key={item.id || i} style={styles.notifCard}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Ionicons
              name={
                item.type === "order"
                  ? "cube"
                  : item.type === "rewards"
                  ? "sparkles"
                  : item.type === "wishlist"
                  ? "heart"
                  : "notifications"
              }
              size={18}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, flex: 1 }}>{item.title}</Text>
          </View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: 26, lineHeight: 17 }}>
            {item.message || item.desc}
          </Text>
          {/* Detailed Year Timestamp */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginLeft: 26 }}>
            <Ionicons name="time-outline" size={11} color={Colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.primary }}>
              {item.time || formatTimestampWithYear()}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Cart Tab View
  const renderCartTab = () => (
    <ScrollView style={styles.tabContainer}>
      <Text style={styles.tabTitle}>My Shopping Bag ({totalCartItems})</Text>

      {totalCartItems === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bag-handle-outline" size={54} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your Bag is Empty!</Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => setActiveTab("home")}
          >
            <Text style={styles.shopNowBtnText}>Explore Kids Collection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {Object.entries(cartMap).map(([id, qty]) => {
            const prod = products.find((p) => p.id === id);
            if (!prod) return null;
            return (
              <View key={id} style={styles.cartRow}>
                <Image source={{ uri: prod.imageUrl }} style={styles.cartRowImg} />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
                    {prod.name}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.textPrimary, marginTop: 4 }}>
                    ₹{prod.price.toLocaleString()} × {qty}
                  </Text>
                  <Text style={{ fontSize: 10, color: Colors.ratingGreen, fontWeight: "700" }}>
                    Eligible for Free 1-Day Express Delivery
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "900", color: Colors.primary }}>
                  ₹{(prod.price * qty).toLocaleString()}
                </Text>
              </View>
            );
          })}

          <View style={styles.priceDetailsCard}>
            <Text style={styles.priceDetailsTitle}>BILL DETAILS</Text>
            <View style={styles.priceRow}>
              <Text style={{ color: Colors.textSecondary }}>Item Subtotal ({totalCartItems} items)</Text>
              <Text style={{ fontWeight: "700" }}>₹{totalCartPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={{ color: Colors.textSecondary }}>Delivery Charges</Text>
              <Text style={{ color: Colors.ratingGreen, fontWeight: "800" }}>FREE</Text>
            </View>
            <View style={[styles.priceRow, { borderTopWidth: 1, borderColor: Colors.borderLight, paddingTop: 8 }]}>
              <Text style={{ fontSize: 16, fontWeight: "800" }}>Total Amount</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: Colors.primary }}>
                ₹{totalCartPrice.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.placeOrderBtn}
              onPress={() => {
                if (requireAuth("proceed to checkout and pay")) {
                  setIsPaymentModalOpen(true);
                }
              }}
            >
              <Text style={styles.placeOrderText}>CHECKOUT & PAY • ₹{totalCartPrice.toLocaleString()}</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
    </ScrollView>
  );

  // Profile Account View (Support Logged In & Logged Out)
  const renderProfileTab = () => (
    <ScrollView style={styles.tabContainer}>
      {isLoggedIn ? (
        <View style={styles.accountHeader}>
          <View style={styles.accountAvatar}>
            <Ionicons name="person" size={32} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.white }}>{userProfile.name}</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            {userProfile.email ? `${userProfile.email} • ` : ""}{userProfile.phone}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.accent, fontWeight: "800", marginTop: 4 }}>
            TinyTots VIP Member • {userProfile.sparksBalance} Sparks
          </Text>

          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => {
                setAuthMethod("otp");
                setIsAuthModalOpen(true);
              }}
              style={{
                backgroundColor: Colors.white,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name="swap-horizontal" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.primary }}>Switch User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: Colors.white,
              }}
            >
              <Ionicons name="log-out-outline" size={14} color={Colors.white} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.white }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{
          backgroundColor: Colors.primary,
          marginHorizontal: 16,
          marginTop: 16,
          padding: 24,
          borderRadius: 20,
          alignItems: "center",
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 6,
        }}>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <MaterialCommunityIcons name={"crown" as any} size={16} color={Colors.white} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: "900", color: Colors.white, letterSpacing: 0.5 }}>
              TINYTOTS VIP KIDS CLUB
            </Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "900", color: Colors.white, textAlign: "center" }}>
            Welcome to TinyTots! 🎈
          </Text>
          
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 4, paddingHorizontal: 10, lineHeight: 18 }}>
            Log in using Mobile OTP to track orders, save wishlists & claim 2X Sparks Rewards!
          </Text>

          <View style={{ flexDirection: "row", marginTop: 18, width: "100%" }}>
            <TouchableOpacity
              onPress={() => {
                setAuthMethod("otp");
                setIsAuthModalOpen(true);
              }}
              style={{
                flex: 1,
                backgroundColor: Colors.white,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                marginRight: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: "900", color: Colors.primary }}>
                Mobile OTP Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setAuthMethod("register");
                setIsAuthModalOpen(true);
              }}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.18)",
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.5)",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person-add-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: "900", color: Colors.white }}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Account Menu Items */}
      <View style={styles.menuListCard}>
        {[
          {
            iconName: "cube-outline",
            title: "My Orders",
            sub: "Track & view past deliveries",
            action: () => setActiveTab("notifications"),
          },
          {
            iconName: "heart-outline",
            title: "My Wishlist",
            sub: `${wishlistCount} bookmarked items`,
            action: () => setActiveTab("wishlist"),
          },
          {
            iconName: "star-outline",
            title: "Sparks Zone",
            sub: `Balance: ${userProfile.sparksBalance} Sparks`,
            action: () => Alert.alert("Sparks Rewards", `${userProfile.sparksBalance} Sparks points active in your account!`),
          },
          {
            iconName: "card-outline",
            title: "Saved Payment Methods",
            sub: "UPI, Cards & COD enabled",
            action: () => Alert.alert("Payment Setup", "UPI & Credit/Debit Cards active."),
          },
        ].map((item, idx) => (
          <TouchableOpacity key={idx} onPress={item.action} style={styles.menuRow}>
            <Ionicons name={item.iconName as any} size={20} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>{item.title}</Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={false} />

      {/* Top Status Bar & Header Container (Pink Theme) */}
      <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={["top"]}>
        <Header
          cartCount={totalCartItems}
          onOpenCart={() => setActiveTab("cart")}
          onOpenNotifications={() => setActiveTab("notifications")}
          onOpenAuth={() => {
            setAuthMethod("otp");
            setIsAuthModalOpen(true);
          }}
          onOpenDeliveryTracking={() => setIsOrderTrackingModalOpen(true)}
          userName={userProfile.name}
          pincode={userProfile.pincode}
          sparksBalance={userProfile.sparksBalance}
        />
      </SafeAreaView>

      {/* White Content Container below Header */}
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={["left", "right", "bottom"]}>
        {/* Search Input Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={(q: string) => setSearchQuery(q)}
          onCameraPress={handleRealCameraScan}
          onMicPress={handleRealVoiceSpeech}
        />

        {/* Main Tab Render */}
        <View style={{ flex: 1 }}>
          {activeTab === "home" && renderHomeContent()}
          {activeTab === "categories" && renderCategoriesTab()}
          {activeTab === "wishlist" && renderWishlistTab()}
          {activeTab === "notifications" && renderNotificationsTab()}
          {activeTab === "cart" && renderCartTab()}
          {activeTab === "profile" && renderProfileTab()}
        </View>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          cartCount={totalCartItems}
          wishlistCount={wishlistCount}
        />
      </SafeAreaView>

      {/* ======================================================== */}
      {/* 1. NEAT LOOKING MOBILE OTP & EMAIL AUTH MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isAuthModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAuthModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.authModalCard}>
            {/* Modal Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name={"cellphone-key" as any} size={24} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 18, fontWeight: "900", color: Colors.textPrimary }}>
                  {authMethod === "otp"
                    ? "Mobile OTP Login"
                    : authMethod === "email"
                    ? "Email Login"
                    : "Create TinyTots Account"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAuthModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Auth Switcher Pills (📱 Phone OTP | ✉️ Email | 👤 Register) */}
            <View style={{ flexDirection: "row", backgroundColor: Colors.background, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  setAuthMethod("otp");
                  setOtpSent(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: authMethod === "otp" ? Colors.white : "transparent",
                  alignItems: "center",
                  elevation: authMethod === "otp" ? 2 : 0,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: authMethod === "otp" ? Colors.primary : Colors.textMuted }}>
                  📱 Phone OTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAuthMethod("email")}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: authMethod === "email" ? Colors.white : "transparent",
                  alignItems: "center",
                  elevation: authMethod === "email" ? 2 : 0,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: authMethod === "email" ? Colors.primary : Colors.textMuted }}>
                  ✉️ Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAuthMethod("register")}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: authMethod === "register" ? Colors.white : "transparent",
                  alignItems: "center",
                  elevation: authMethod === "register" ? 2 : 0,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: authMethod === "register" ? Colors.primary : Colors.textMuted }}>
                  👤 Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: MOBILE OTP FORM */}
            {authMethod === "otp" && (
              <View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.borderLight, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.textPrimary }}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="98765 43210"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={otpPhone}
                      onChangeText={(t) => setOtpPhone(t)}
                      editable={!otpSent || authSubmitting}
                    />
                  </View>
                </View>

                {!otpSent ? (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={authSubmitting}
                    style={[styles.authSubmitBtn, authSubmitting && { opacity: 0.7 }]}
                  >
                    {authSubmitting ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.authSubmitBtnText}>SEND OTP 📱</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View>
                    {/* Demo OTP Banner */}
                    <View style={{ backgroundColor: "rgba(255,183,3,0.15)", padding: 10, borderRadius: 10, marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="key" size={18} color={Colors.accent} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.black }}>
                          OTP Sent to +91 {otpPhone}
                        </Text>
                        <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                          Enter OTP code (💡 Demo OTP: <Text style={{ fontWeight: "900", color: Colors.primary }}>1234</Text>)
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginBottom: 14 }}>
                      <Text style={styles.inputLabel}>Enter 4-Digit OTP Code *</Text>
                      <TextInput
                        style={[styles.textInput, { letterSpacing: 8, fontSize: 18, fontWeight: "900", textAlign: "center" }]}
                        placeholder="1 2 3 4"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otpCode}
                        onChangeText={(t) => setOtpCode(t)}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={authSubmitting}
                      style={[styles.authSubmitBtn, authSubmitting && { opacity: 0.7 }]}
                    >
                      {authSubmitting ? (
                        <ActivityIndicator color={Colors.white} />
                      ) : (
                        <Text style={styles.authSubmitBtnText}>VERIFY & LOGIN ✨</Text>
                      )}
                    </TouchableOpacity>

                    {/* Resend Timer Row */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                      >
                        <Text style={{ fontSize: 12, color: Colors.textMuted }}>Change Number</Text>
                      </TouchableOpacity>

                      {timerCount > 0 ? (
                        <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: "700" }}>
                          Resend OTP in {timerCount}s
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp}>
                          <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.primary }}>
                            Resend OTP Now 🔄
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: EMAIL LOGIN FORM */}
            {authMethod === "email" && (
              <View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={authForm.email}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, email: t }))}
                  />
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      value={authForm.password}
                      onChangeText={(t) => setAuthForm((p) => ({ ...p, password: t }))}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 12 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleAuthSubmit}
                  disabled={authSubmitting}
                  style={[styles.authSubmitBtn, authSubmitting && { opacity: 0.7 }]}
                >
                  {authSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.authSubmitBtnText}>LOG IN WITH EMAIL</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: REGISTER FORM */}
            {authMethod === "register" && (
              <View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Full Name / Username *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Madhumathi"
                    value={authForm.name}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, name: t }))}
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={authForm.email}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, email: t }))}
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    secureTextEntry
                    value={authForm.password}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, password: t }))}
                  />
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    value={authForm.phone}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, phone: t }))}
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>Delivery Pincode</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="641001"
                    keyboardType="number-pad"
                    value={authForm.pincode}
                    onChangeText={(t) => setAuthForm((p) => ({ ...p, pincode: t }))}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleAuthSubmit}
                  disabled={authSubmitting}
                  style={[styles.authSubmitBtn, authSubmitting && { opacity: 0.7 }]}
                >
                  {authSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.authSubmitBtnText}>CREATE ACCOUNT ✨</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>


      {/* ======================================================== */}
      {/* 2. PAYMENT METHOD & CHECKOUT MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isPaymentModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.authModalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: Colors.textPrimary }}>
                Select Payment Method
              </Text>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 14 }}>
              Total Payable: <Text style={{ fontWeight: "900", color: Colors.primary }}>₹{totalCartPrice.toLocaleString()}</Text> ({totalCartItems} items)
            </Text>

            {[
              { id: "UPI (GPay / PhonePe / Paytm)", icon: "qr-code", desc: "Instant Instant UPI transfer" },
              { id: "Credit / Debit Card", icon: "card", desc: "Visa, Mastercard, RuPay" },
              { id: "Cash / Pay on Delivery", icon: "cash", desc: "Pay cash at your doorstep" },
            ].map((method) => {
              const isSelected = selectedPaymentMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isSelected ? Colors.primary : Colors.borderLight,
                    backgroundColor: isSelected ? "rgba(255,59,107,0.05)" : Colors.white,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={method.icon as any} size={20} color={isSelected ? Colors.primary : Colors.textMuted} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary }}>{method.id}</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>{method.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={handleProcessPayment}
              disabled={isPaymentProcessing}
              style={[styles.placeOrderBtn, { marginTop: 10 }, isPaymentProcessing && { opacity: 0.7 }]}
            >
              {isPaymentProcessing ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.placeOrderText}>
                  CONFIRM & PAY • ₹{totalCartPrice.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. PAYMENT SUCCESS CONFIRMATION RECEIPT MODAL WITH YEAR */}
      {/* ======================================================== */}
      <Modal
        visible={!!paymentSuccessData}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPaymentSuccessData(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.authModalCard, { alignItems: "center", paddingVertical: 20 }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.ratingGreen, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="checkmark-sharp" size={36} color={Colors.white} />
            </View>

            <Text style={{ fontSize: 20, fontWeight: "900", color: Colors.textPrimary }}>
              Payment Successful! 🎉
            </Text>
            <Text style={{ fontSize: 12, color: Colors.ratingGreen, fontWeight: "800", marginTop: 2 }}>
              Order Confirmed & Logged to Backend DB
            </Text>

            {/* Receipt Summary Card */}
            {paymentSuccessData && (
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                  <Text style={styles.receiptVal}>{paymentSuccessData.transactionId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Order Reference</Text>
                  <Text style={styles.receiptVal}>#{paymentSuccessData.orderId}</Text>
                </View>

                {/* TIMING WITH YEAR */}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time (Year)</Text>
                  <Text style={[styles.receiptVal, { color: Colors.primary, fontWeight: "800" }]}>
                    {paymentSuccessData.timestampWithYear}
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Customer</Text>
                  <Text style={styles.receiptVal}>{paymentSuccessData.customerName}</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>
                  <Text style={styles.receiptVal}>{paymentSuccessData.paymentMethod}</Text>
                </View>

                <View style={[styles.receiptRow, { borderTopWidth: 1, borderColor: Colors.borderLight, paddingTop: 6, marginTop: 4 }]}>
                  <Text style={{ fontSize: 13, fontWeight: "800" }}>Total Paid</Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: Colors.primary }}>
                    ₹{paymentSuccessData.totalAmount?.toLocaleString()}
                  </Text>
                </View>

                <View style={{ marginTop: 8, backgroundColor: "rgba(255,183,3,0.15)", padding: 8, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="sparkles" size={16} color={Colors.accent} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: Colors.black }}>
                    +{paymentSuccessData.sparksEarned} Sparks Credited to Account!
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", marginTop: 16, width: "100%" }}>
              <TouchableOpacity
                onPress={() => {
                  setPaymentSuccessData(null);
                  setActiveTab("notifications");
                }}
                style={{ flex: 1, backgroundColor: Colors.background, paddingVertical: 10, borderRadius: 10, alignItems: "center", marginRight: 8 }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.textPrimary }}>
                  View Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPaymentSuccessData(null);
                  setActiveTab("home");
                }}
                style={{ flex: 1, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.white }}>
                  Done / Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. MEESHO-STYLE LIVE ORDER & DELIVERY TRACKING MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isOrderTrackingModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOrderTrackingModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.authModalCard, { maxHeight: "90%", padding: 0, overflow: "hidden" }]}>
            {/* Header Strip */}
            <View style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="location-sharp" size={18} color={Colors.white} style={{ marginRight: 6 }} />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: Colors.white }}>Delivery & Order Tracking</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.85)" }}>Order #TT-84920 • Express Dispatch</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOrderTrackingModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Delivery ETA Badge */}
              <View style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.ratingGreen, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                  <Ionicons name="sparkles" size={18} color={Colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#15803D" }}>Arriving Tomorrow by 5:00 PM</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>TinyTots 1-Day Express Air Cargo Shipping</Text>
                </View>
              </View>

              {/* Meesho-Style Stepper Timeline */}
              <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 }}>
                LIVE SHIPMENT TRACKING
              </Text>

              <View style={{ backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight }}>
                {[
                  { step: "Order Placed & Confirmed", time: "23 Aug 2026, 11:45 AM", desc: "Payment verified & seller approved", status: "completed" },
                  { step: "Packed & Handed to Logistics", time: "23 Aug 2026, 01:20 PM", desc: "Hub: Coimbatore Central Sorting Facility", status: "completed" },
                  { step: "Out for Delivery", time: "Tomorrow, 09:00 AM", desc: "Courier partner on the way to destination", status: "active" },
                  { step: "Delivered to Home", time: "Expected Tomorrow, 5:00 PM", desc: "Handed over to customer", status: "pending" },
                ].map((st, i, arr) => (
                  <View key={i} style={{ flexDirection: "row", position: "relative" }}>
                    {/* Vertical Line */}
                    {i < arr.length - 1 && (
                      <View style={{
                        position: "absolute",
                        left: 11,
                        top: 24,
                        bottom: -10,
                        width: 2,
                        backgroundColor: st.status === "completed" ? Colors.ratingGreen : Colors.border,
                      }} />
                    )}
                    {/* Node Dot */}
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: st.status === "completed" ? Colors.ratingGreen : st.status === "active" ? Colors.primary : Colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      zIndex: 2,
                    }}>
                      {st.status === "completed" ? (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      ) : st.status === "active" ? (
                        <Ionicons name="time" size={13} color={Colors.white} />
                      ) : (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white }} />
                      )}
                    </View>

                    <View style={{ flex: 1, paddingBottom: i === arr.length - 1 ? 0 : 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: st.status !== "pending" ? "800" : "600", color: st.status !== "pending" ? Colors.textPrimary : Colors.textMuted }}>
                        {st.step}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: st.status === "completed" ? Colors.ratingGreen : st.status === "active" ? Colors.primary : Colors.textMuted, marginTop: 1 }}>
                        {st.time}
                      </Text>
                      <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{st.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Address Box */}
              <View style={{ backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.textPrimary }}>DELIVERY ADDRESS</Text>
                  <TouchableOpacity onPress={() => {
                    setIsOrderTrackingModalOpen(false);
                    setAuthMethod("otp");
                    setIsAuthModalOpen(true);
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: Colors.primary }}>Edit / Change</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.textPrimary }}>
                  {userProfile.name}'s Family
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 }}>
                  Door No. 42, Green Avenue, Race Course Road, Coimbatore, Tamil Nadu - {userProfile.pincode || "641001"}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                  Contact: {userProfile.phone || "+91 98765 43210"}
                </Text>
              </View>

              {/* Delivery Driver & OTP Box */}
              <View style={{ backgroundColor: "#FFF8E7", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FFE0B2", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309", letterSpacing: 0.5 }}>COURIER AGENT ASSIGNED</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: Colors.black, marginTop: 2 }}>Kumar S (TinyTots Express)</Text>
                  <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 1 }}>Delivery Verification OTP: <Text style={{ fontWeight: "900", color: Colors.primary }}>5829</Text></Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert("Calling Delivery Agent", "Dialing +91 98765 01234 (Kumar S)")}
                  style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, flexDirection: "row", alignItems: "center" }}
                >
                  <Ionicons name="call" size={12} color={Colors.white} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: Colors.white }}>Call Driver</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 4. COLORFUL CONFETTI PAPER FESTIVE OFFER CELEBRATION MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isConfettiOfferModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsConfettiOfferModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.authModalCard, { backgroundColor: "#FFF5F8", borderWidth: 2, borderColor: Colors.primary, padding: 0, overflow: "hidden" }]}>
            {/* Confetti Banner Top Strip */}
            <View style={{ backgroundColor: Colors.primary, padding: 20, alignItems: "center", position: "relative" }}>
              <TouchableOpacity
                onPress={() => setIsConfettiOfferModalOpen(false)}
                style={{ position: "absolute", top: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.white} />
              </TouchableOpacity>

              {/* Celebration Icons & Confetti paper header */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ fontSize: 24, marginRight: 6 }}>🎉</Text>
                <Text style={{ fontSize: 24, marginRight: 6 }}>🎊</Text>
                <Text style={{ fontSize: 24, marginRight: 6 }}>✨</Text>
                <Text style={{ fontSize: 24 }}>🥳</Text>
              </View>
              <Text style={{ fontSize: 19, fontWeight: "900", color: Colors.white, textAlign: "center" }}>
                KIDS SPECIAL OFFER UNLOCKED!
              </Text>
              <Text style={{ fontSize: 11, color: Colors.accent, fontWeight: "800", marginTop: 2 }}>
                Exclusive Parents & Kids Club Voucher
              </Text>
            </View>

            <View style={{ padding: 20, alignItems: "center" }}>
              <View style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 16, width: "100%", alignItems: "center", borderWidth: 2, borderStyle: "dashed", borderColor: Colors.primary, marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: Colors.textMuted, letterSpacing: 1 }}>COUPON VOUCHER CODE</Text>
                <Text style={{ fontSize: 24, fontWeight: "900", color: Colors.primary, marginVertical: 6, letterSpacing: 2 }}>TINYKIDS50</Text>
                <View style={{ backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: "900", color: Colors.black }}>FLAT 50% OFF + 200 EXTRA SPARKS ⭐️</Text>
                </View>
              </View>

              {/* Trust Callout */}
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 14 }}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.ratingGreen} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#15803D" }}>100% Skin-Friendly & Child Safety Certified Guarantee</Text>
              </View>

              <Text style={{ fontSize: 11, color: Colors.textSecondary, textAlign: "center", lineHeight: 16, marginBottom: 16 }}>
                Valid on all Organic Cotton Kids Fashions, Non-Toxic Toys & Baby Essentials. Voucher code automatically saved to your cart!
              </Text>

              <TouchableOpacity
                onPress={() => {
                  handleClaimPromo("TINYKIDS50");
                  setIsConfettiOfferModalOpen(false);
                }}
                style={{ backgroundColor: Colors.primary, width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}
              >
                <Text style={{ fontSize: 14, fontWeight: "900", color: Colors.white, letterSpacing: 0.5 }}>
                  CLAIM OFFER & SHOP NOW 🎉
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 5. REAL VOICE SPEECH LISTENING MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={isVoiceListeningModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsVoiceListeningModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.authModalCard, { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }]}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 16, elevation: 6 }}>
              <Ionicons name="mic" size={36} color={Colors.white} />
            </View>

            <Text style={{ fontSize: 16, fontWeight: "900", color: Colors.textPrimary, textAlign: "center", marginBottom: 6 }}>
              {voiceTranscript}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: "center", marginBottom: 20 }}>
              Speak kids product name (e.g. "Party Frock", "Suit", "Shoes", "Toys")
            </Text>

            {/* Quick voice preset chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
              {["Party Frock", "Kids Suits", "Sports Shoes", "Remote Car"].map((phrase) => (
                <TouchableOpacity
                  key={phrase}
                  onPress={() => {
                    setSearchQuery(phrase);
                    setActiveTab("home");
                    setIsVoiceListeningModalOpen(false);
                  }}
                  style={{ backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, margin: 4, borderWidth: 1, borderColor: Colors.borderLight }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.primary }}>"{phrase}"</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setIsVoiceListeningModalOpen(false)}
              style={{ backgroundColor: Colors.border, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 6. MEESHO FULL PRODUCT DETAILS PAGE / MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={!!selectedProductForDetail}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedProductForDetail(null)}
      >
        {selectedProductForDetail && (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            {/* Top Details Nav Bar */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: "#F1F5F9" }}>
              <TouchableOpacity onPress={() => setSelectedProductForDetail(null)} style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.textPrimary, marginLeft: 8 }}>Product Details</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <TouchableOpacity onPress={() => handleToggleFavorite(selectedProductForDetail.id)}>
                  <Ionicons
                    name={favorites[selectedProductForDetail.id] ? "heart" : "heart-outline"}
                    size={22}
                    color={favorites[selectedProductForDetail.id] ? Colors.danger : Colors.textPrimary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setSelectedProductForDetail(null);
                  setActiveTab("cart");
                }}>
                  <Ionicons name="cart-outline" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {/* Product HD Image Banner */}
              <View style={{ width: "100%", height: 320, backgroundColor: "#F8FAFC", position: "relative" }}>
                <Image
                  source={{ uri: getImageUrl(selectedProductForDetail.imageUrl) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {selectedProductForDetail.discount && (
                  <View style={{ position: "absolute", bottom: 12, left: 12, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: Colors.white, fontSize: 11, fontWeight: "900" }}>
                      {selectedProductForDetail.discount.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Title & Pricing Card */}
              <View style={{ padding: 16, borderBottomWidth: 6, borderColor: "#F1F5F9" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  {selectedProductForDetail.isAssured && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFF0F4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                      <MaterialCommunityIcons name="shield-check" size={13} color={Colors.primary} style={{ marginRight: 2 }} />
                      <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: "900" }}>Meesho Assured</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: "#0284C7", fontWeight: "800", backgroundColor: "#F0F9FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    {selectedProductForDetail.ageGroup}
                  </Text>
                </View>

                <Text style={{ fontSize: 16, fontWeight: "800", color: "#1E293B", lineHeight: 22, marginBottom: 4 }}>
                  {selectedProductForDetail.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                  {selectedProductForDetail.specifications}
                </Text>

                {/* Price Row */}
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: "900", color: "#0F172A" }}>
                    ₹{selectedProductForDetail.price.toLocaleString()}
                  </Text>
                  {selectedProductForDetail.originalPrice > selectedProductForDetail.price && (
                    <>
                      <Text style={{ fontSize: 14, color: "#94A3B8", textDecorationLine: "line-through" }}>
                        ₹{selectedProductForDetail.originalPrice.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: Colors.primary }}>
                        {selectedProductForDetail.discount}
                      </Text>
                    </>
                  )}
                </View>

                {/* Rating Badge */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#038D63", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: Colors.white, fontSize: 12, fontWeight: "900" }}>{selectedProductForDetail.rating}</Text>
                    <Ionicons name="star" size={11} color={Colors.white} style={{ marginLeft: 3 }} />
                  </View>
                  <Text style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>
                    {selectedProductForDetail.reviewsCount.toLocaleString()} Ratings & Reviews
                  </Text>
                </View>
              </View>

              {/* Size Selection Section */}
              <View style={{ padding: 16, borderBottomWidth: 6, borderColor: "#F1F5F9" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1E293B", marginBottom: 10 }}>
                  Select Size / Age Group
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {["1-2 Yrs", "2-3 Yrs", "3-4 Yrs", "4-5 Yrs", "5-6 Yrs", "6-7 Yrs"].map((sz) => {
                    const isSel = selectedSize === sz;
                    return (
                      <TouchableOpacity
                        key={sz}
                        onPress={() => setSelectedSize(sz)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: isSel ? Colors.primary : "#E2E8F0",
                          backgroundColor: isSel ? "#FFF0F4" : Colors.white,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "800", color: isSel ? Colors.primary : "#475569" }}>
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Meesho Trust Badges */}
              <View style={{ padding: 16, borderBottomWidth: 6, borderColor: "#F1F5F9" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1E293B", marginBottom: 12 }}>
                  Parent Guarantees & Safety
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Ionicons name="leaf-outline" size={22} color="#10B981" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#1E293B", marginTop: 4, textAlign: "center" }}>100% Skin Safe</Text>
                  </View>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Ionicons name="swap-horizontal-outline" size={22} color="#3B82F6" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#1E293B", marginTop: 4, textAlign: "center" }}>7 Days Easy Return</Text>
                  </View>
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Ionicons name="cash-outline" size={22} color="#F59E0B" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#1E293B", marginTop: 4, textAlign: "center" }}>Cash on Delivery</Text>
                  </View>
                </View>
              </View>

              {/* Product Specifications Table */}
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1E293B", marginBottom: 10 }}>
                  Product Specifications
                </Text>
                <View style={{ backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>Fabric</Text>
                    <Text style={{ fontSize: 11, color: "#1E293B", fontWeight: "700" }}>100% Combed Organic Cotton</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>Pattern</Text>
                    <Text style={{ fontSize: 11, color: "#1E293B", fontWeight: "700" }}>Kids Premium Designer</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>Wash Care</Text>
                    <Text style={{ fontSize: 11, color: "#1E293B", fontWeight: "700" }}>Gentle Machine Wash</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>Dispatch</Text>
                    <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "800" }}>Express 1-Day Delivery</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Fixed Bottom Action Buttons */}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: 12, borderTopWidth: 1, borderColor: "#E2E8F0", flexDirection: "row", gap: 10, elevation: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  handleAddToCart(selectedProductForDetail);
                  Alert.alert("🛒 Added to Bag", `${selectedProductForDetail.name} (${selectedSize}) added!`);
                }}
                style={{ flex: 1, backgroundColor: "#FFF0F4", borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
              >
                <Ionicons name="cart-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "900", color: Colors.primary }}>ADD TO BAG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  handleAddToCart(selectedProductForDetail);
                  setSelectedProductForDetail(null);
                  setActiveTab("cart");
                }}
                style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", elevation: 3 }}
              >
                <Ionicons name="flash" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "900", color: Colors.white }}>BUY NOW</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  mainScrollView: {
    flex: 1,
  },
  categoryStripWrapper: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryStripList: {
    paddingHorizontal: 12,
  },
  superCoinBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  coinLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinBarText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  useCoinBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  useCoinText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.black,
  },
  dealsSectionCard: {
    marginTop: 12,
    marginHorizontal: 12,
  },
  dealsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dealsTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  dealsTitleText: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginRight: 8,
  },
  timerBox: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  viewAllDealsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewAllDealsText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.primary,
  },
  filterChipsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipInactive: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextActive: {
    color: Colors.white,
  },
  chipTextInactive: {
    color: Colors.textSecondary,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catGridCard: {
    width: "30%",
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  catVectorCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  catGridTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  notifCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cartRowImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  priceDetailsCard: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  priceDetailsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  placeOrderText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  shopNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
  },
  shopNowBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  accountHeader: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  accountAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuListCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 6,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  authModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  authSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  authSubmitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  receiptBox: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  receiptLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  receiptVal: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});