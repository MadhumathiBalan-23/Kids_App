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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

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

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    phone: string;
    sparksBalance: number;
  }>({
    name: "Madhumathi",
    phone: "+91 98765 43210",
    sparksBalance: 680,
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
  });
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activePromo, setActivePromo] = useState<string | null>(null);

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
      if (apiNotifs && Array.isArray(apiNotifs)) {
        setNotifications(apiNotifs);
      }
      if (apiProfile) {
        setUserProfile({
          name: apiProfile.name || "Madhumathi",
          phone: apiProfile.phone || "+91 98765 43210",
          sparksBalance: apiProfile.sparksBalance ?? 680,
        });
      }
      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err) {
      console.log("Live sync using seed/cache:", err);
    } finally {
      setIsLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Fetch immediately & setup continuous background reactive polling (every 3 seconds)
  useEffect(() => {
    setIsLoading(true);
    loadAPIData(false);

    // Reactive Poll: automatically discovers products added in Admin!
    const pollTimer = setInterval(() => {
      loadAPIData(false);
    }, 3000);

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

  // Handlers
  const handleAddToCart = (product: Product) => {
    setCartMap((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (product: Product) => {
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
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleClaimPromo = (code: string) => {
    setActivePromo(code);
    Alert.alert("Coupon Applied! 🎉", `Promo code '${code}' activated!`);
  };

  const handleCheckout = async () => {
    const itemsPayload = Object.entries(cartMap).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    try {
      const response = await MarketService.placeOrder({
        customerName: userProfile.name || "Madhumathi",
        address: "Coimbatore, Tamil Nadu - 641001",
        items: itemsPayload,
        paymentMethod: "UPI / Card on Delivery",
      });

      if (response && response.success) {
        Alert.alert(
          "Order Confirmed! 🚀",
          `Order ID: ${response.data.id || response.data.orderId}\nDelivery: ${response.data.estimatedDelivery || "Tomorrow by 5:00 PM"}`
        );
        setCartMap({});
        setActiveTab("home");
      }
    } catch (error) {
      Alert.alert("Order Placed! 🚀", "Thank you for shopping on TinyTots Kids Mart!");
      setCartMap({});
      setActiveTab("home");
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

      {/* Horizontal Vector Category Strip */}
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
      <BannerSlider onClaimPromo={handleClaimPromo} />

      {/* Sparks Banner Bar */}
      <View style={styles.superCoinBar}>
        <View style={styles.coinLeft}>
          <Ionicons name="sparkles" size={16} color={Colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.coinBarText}>
            Earn <Text style={{ fontWeight: "900", color: Colors.black }}>2X Sparks</Text> on all kids orders!
          </Text>
        </View>
        <TouchableOpacity style={styles.useCoinBtn}>
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
          <TouchableOpacity style={styles.viewAllDealsBtn}>
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
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try searching for another product or age group.</Text>
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
              <MaterialCommunityIcons name={c.iconName as any} size={32} color={Colors.primary} />
            </View>
            <Text style={styles.catGridTitle}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Notifications Tab View
  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Notifications & Offers</Text>
      {(notifications.length > 0
        ? notifications
        : [
            {
              title: "🎉 TinyTots Kids Festival is LIVE!",
              message: "Up to 50% OFF on Party Wear, Frocks & Suits.",
              time: "2h ago",
            },
            {
              title: "📦 Order Shipped!",
              message: "Your order #TT84920 has been dispatched via Express.",
              time: "5h ago",
            },
            {
              title: "⭐ 680 Sparks Added",
              message: "Sparks credited to your TinyTots Kids Club Account.",
              time: "1d ago",
            },
          ]
      ).map((item, i) => (
        <View key={item.id || i} style={styles.notifCard}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Ionicons
              name={item.type === "order" ? "cube" : item.type === "rewards" ? "sparkles" : "notifications"}
              size={16}
              color={Colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>{item.title}</Text>
          </View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: 22 }}>
            {item.message || item.desc}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 6, marginLeft: 22 }}>
            {item.time || "Recent"}
          </Text>
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
              onPress={handleCheckout}
            >
              <Text style={styles.placeOrderText}>PLACE ORDER • ₹{totalCartPrice.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "Madhumathi",
    phone: "+91 98765 43210",
    pincode: "641001",
  });

  const handleSaveProfile = async () => {
    try {
      await MarketService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        pincode: profileForm.pincode,
      });
      setUserProfile((prev) => ({
        ...prev,
        name: profileForm.name,
        phone: profileForm.phone,
      }));
      setIsEditProfileOpen(false);
      Alert.alert("Profile Updated! ✨", "Your account information was saved to the server.");
    } catch (err) {
      setUserProfile((prev) => ({
        ...prev,
        name: profileForm.name,
        phone: profileForm.phone,
      }));
      setIsEditProfileOpen(false);
      Alert.alert("Profile Updated! ✨", "Your account information has been updated.");
    }
  };

  // Profile Account View
  const renderProfileTab = () => (
    <ScrollView style={styles.tabContainer}>
      <View style={styles.accountHeader}>
        <View style={styles.accountAvatar}>
          <Ionicons name="person" size={32} color={Colors.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.white }}>{userProfile.name}</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
          {userProfile.phone} • TinyTots VIP Kids Club Member
        </Text>

        <TouchableOpacity
          onPress={() => {
            setProfileForm({
              name: userProfile.name,
              phone: userProfile.phone,
              pincode: "641001",
            });
            setIsEditProfileOpen(true);
          }}
          style={{
            marginTop: 12,
            backgroundColor: Colors.white,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="create-outline" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.primary }}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuListCard}>
        {[
          { iconName: "cube-outline", title: "My Orders", sub: "Track & view past deliveries", action: () => Alert.alert("My Orders", "You have 3 active orders in fulfillment.") },
          { iconName: "heart-outline", title: "My Wishlist", sub: `${Object.keys(favorites).length} bookmarked items`, action: () => Alert.alert("Wishlist", `${Object.keys(favorites).length} items saved.`) },
          { iconName: "star-outline", title: "Sparks Zone", sub: `Balance: ${userProfile.sparksBalance} Sparks`, action: () => Alert.alert("Sparks Club", `${userProfile.sparksBalance} loyalty sparks available.`) },
          { iconName: "card-outline", title: "Saved Payment Methods", sub: "UPI & Cards", action: () => Alert.alert("Payments", "UPI / Card on Delivery enabled.") },
          { iconName: "location-outline", title: "Delivery Addresses", sub: "Coimbatore, Tamil Nadu", action: () => setIsEditProfileOpen(true) },
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

      {/* Edit Profile / Address Form View */}
      {isEditProfileOpen && (
        <View style={{ marginTop: 14, backgroundColor: Colors.white, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderLight }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 }}>
            Edit Profile & Delivery Details
          </Text>

          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 }}>Full Name</Text>
            <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: Colors.textPrimary }}>{profileForm.name}</Text>
            </View>
          </View>

          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 }}>Phone Number</Text>
            <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: Colors.textPrimary }}>{profileForm.phone}</Text>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 }}>Pincode</Text>
            <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: Colors.textPrimary }}>{profileForm.pincode}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity
              onPress={() => setIsEditProfileOpen(false)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: Colors.white }}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );


  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Sticky Mobile Header + Search Bar pinned at top when scrolling */}
      <View style={styles.stickyTopBar}>
        <Header cartCount={totalCartItems} onOpenCart={() => setActiveTab("cart")} />
        {activeTab === "home" && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => {
              Alert.alert("Kids Wear Filters", "Sort: Relevance, Price: Low to High, Ratings 4★ & above.");
            }}
          />
        )}
      </View>

      {/* View switching body */}
      <View style={{ flex: 1 }}>
        {activeTab === "home" && renderHomeContent()}
        {activeTab === "categories" && renderCategoriesTab()}
        {activeTab === "notifications" && renderNotificationsTab()}
        {activeTab === "cart" && renderCartTab()}
        {activeTab === "profile" && renderProfileTab()}
      </View>

      {/* Floating Cart Pill */}
      {activeTab === "home" && (
        <CartBar
          totalItems={totalCartItems}
          totalPrice={totalCartPrice}
          onViewCart={() => setActiveTab("cart")}
        />
      )}

      {/* Bottom 5-Tab Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} cartCount={totalCartItems} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  stickyTopBar: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  categoryStripWrapper: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryStripList: {
    paddingHorizontal: 6,
  },
  superCoinBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.accentLight,
    marginHorizontal: 14,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 190, 11, 0.4)",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  coinLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  coinBarText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  useCoinBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  useCoinText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.black,
  },
  dealsSectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 14,
    marginTop: 8,
    paddingTop: 16,
    paddingBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  dealsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  dealsTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  dealsTitleText: {
    fontSize: 17,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  timerBox: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  timerText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  viewAllDealsBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewAllDealsText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  filterChipsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipInactive: {
    backgroundColor: Colors.background,
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
    paddingHorizontal: 12,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
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
    backgroundColor: Colors.background,
  },
  tabTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catGridCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  catVectorCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  catGridTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  notifCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cartRowImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.background,
  },
  priceDetailsCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  priceDetailsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  shopNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  shopNowBtnText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 13,
  },
  accountHeader: {
    backgroundColor: Colors.primary,
    padding: 22,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  accountAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuListCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  liveSyncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  liveSyncText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.2,
  },
});