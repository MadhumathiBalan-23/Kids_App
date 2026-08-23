import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { Product } from "../constants/mockData";

// Server base (without /api) — matches platform
const SERVER_BASE =
  Platform.OS === "android"
    ? "http://10.226.185.65:5001"   // ← LAN IP for physical Android device
    : "http://localhost:5001";

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  isFavorite?: boolean;
  onAddToCart?: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onPressProduct?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  style?: any;
}

const getImageUrl = (url?: string) => {
  if (!url) {
    return "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop&q=80";
  }
  if (url.startsWith("http")) {
    if (Platform.OS === "android" &&
        (url.includes("localhost:5001") || url.includes("10.0.2.2:5001"))) {
      return url.replace(/http:\/\/(localhost|10\.0\.2\.2):5001/, SERVER_BASE);
    }
    return url;
  }
  if (url.startsWith("/")) {
    return `${SERVER_BASE}${url}`;
  }
  return url;
};

export default function ProductCard({
  product,
  cartQuantity = 0,
  isFavorite = false,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  onPressProduct,
  onBuyNow,
  style,
}: ProductCardProps) {
  const handlePressCard = () => {
    if (onPressProduct) {
      onPressProduct(product);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePressCard}
      style={[styles.card, style]}
    >
      {/* Top Header: Age Tag & Wishlist Heart Vector Icon */}
      <View style={styles.topHeader}>
        <View style={styles.ageBadge}>
          <Text style={styles.ageText}>{product.ageGroup}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleFavorite && onToggleFavorite(product.id)}
          style={styles.favoriteCircle}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite ? Colors.danger : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Product Image Click -> Full Details Page */}
      <TouchableOpacity activeOpacity={0.88} onPress={handlePressCard} style={styles.imageBox}>
        <Image
          source={{ uri: getImageUrl(product.imageUrl) }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {product.discount ? (
          <View style={styles.discountBadgeOnImg}>
            <Text style={styles.discountBadgeText}>
              {product.discount.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Product Details - Meesho Font & Layout */}
      <View style={styles.detailsBox}>
        <View style={styles.assuredRow}>
          {product.isAssured && (
            <View style={styles.assuredBadge}>
              <MaterialCommunityIcons name="shield-check" size={11} color={Colors.primary} style={{ marginRight: 2 }} />
              <Text style={styles.assuredText}>Assured</Text>
            </View>
          )}
        </View>

        <Text style={styles.productTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.specsText} numberOfLines={1}>
          {product.specifications}
        </Text>

        {/* Rating Pill */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>{product.rating}</Text>
            <Ionicons name="star" size={9} color={Colors.white} style={{ marginLeft: 2 }} />
          </View>
          <Text style={styles.reviewsCountText}>
            ({product.reviewsCount.toLocaleString()})
          </Text>
        </View>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <Text style={styles.finalPrice}>₹{product.price.toLocaleString()}</Text>
          {product.originalPrice > product.price && (
            <>
              <Text style={styles.originalPrice}>
                ₹{product.originalPrice.toLocaleString()}
              </Text>
              <Text style={styles.discountText}>{product.discount}</Text>
            </>
          )}
        </View>

        {/* Dual Action Buttons: Add to Bag & Buy Now */}
        <View style={styles.dualActionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onAddToCart && onAddToCart(product)}
            style={styles.addOutlineBtn}
          >
            <Ionicons name="cart-outline" size={13} color={Colors.primary} style={{ marginRight: 3 }} />
            <Text style={styles.addOutlineText}>
              {cartQuantity > 0 ? `(${cartQuantity}) ADD` : "ADD"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onBuyNow ? onBuyNow(product) : onAddToCart && onAddToCart(product)}
            style={styles.buySolidBtn}
          >
            <Ionicons name="flash" size={12} color={Colors.white} style={{ marginRight: 3 }} />
            <Text style={styles.buySolidText}>BUY NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    zIndex: 10,
  },
  ageBadge: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  ageText: {
    color: "#0284C7",
    fontSize: 9,
    fontWeight: "800",
  },
  favoriteCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageBox: {
    height: 135,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadgeOnImg: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "900",
  },
  detailsBox: {
    flex: 1,
    justifyContent: "space-between",
  },
  assuredRow: {
    minHeight: 16,
    justifyContent: "center",
    marginBottom: 2,
  },
  assuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F4",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  assuredText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },
  productTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 16,
    height: 32,
  },
  specsText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#038D63",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  reviewsCountText: {
    fontSize: 10,
    color: "#64748B",
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 5,
    flexWrap: "wrap",
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 10,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    marginRight: 3,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.primary,
  },
  dualActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 4,
  },
  addOutlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F4",
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
  },
  addOutlineText: {
    color: Colors.primary,
    fontSize: 9.5,
    fontWeight: "800",
  },
  buySolidBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buySolidText: {
    color: Colors.white,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});