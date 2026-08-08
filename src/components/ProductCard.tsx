import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { Product } from "../constants/mockData";

// Server base (without /api) — matches platform
// Physical Android device uses LAN IP; iOS/web uses localhost
const SERVER_BASE =
  Platform.OS === "android"
    ? "http://192.23.1.52:5001"   // ← LAN IP for physical Android device
    : "http://localhost:5001";


interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  isFavorite?: boolean;
  onAddToCart?: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onPressProduct?: (product: Product) => void;
}

const getImageUrl = (url?: string) => {
  if (!url) {
    return "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop&q=80";
  }
  // Full external URL (https / http from CDN or Cloudinary)
  if (url.startsWith("http")) {
    // Rewrite any localhost or emulator addresses to the current SERVER_BASE
    if (Platform.OS === "android" &&
        (url.includes("localhost:5001") || url.includes("10.0.2.2:5001"))) {
      return url.replace(/http:\/\/(localhost|10\.0\.2\.2):5001/, SERVER_BASE);
    }
    return url;
  }
  // Relative path from server (/uploads/xxx.jpg)
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
}: ProductCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPressProduct && onPressProduct(product)}
      style={styles.card}
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

      {/* Real Product Image */}
      <View style={styles.imageBox}>
        <Image
          source={{ uri: getImageUrl(product.imageUrl) }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>


      {/* Product Details */}
      <View style={styles.detailsBox}>
        <View style={styles.assuredRow}>
          {product.isAssured && (
            <View style={styles.assuredBadge}>
              <MaterialCommunityIcons name="shield-check" size={12} color={Colors.primary} style={{ marginRight: 2 }} />
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
            <Ionicons name="star" size={10} color={Colors.white} style={{ marginLeft: 2 }} />
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

        {/* Action Button with Vector Icons */}
        {cartQuantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onAddToCart && onAddToCart(product)}
            style={styles.addToCartBtn}
          >
            <Ionicons name="bag-add" size={14} color={Colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.addToCartText}>ADD TO BAG</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityBox}>
            <TouchableOpacity
              onPress={() => onRemoveFromCart && onRemoveFromCart(product)}
              style={styles.qtyBtn}
            >
              <Ionicons name="remove" size={14} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{cartQuantity}</Text>

            <TouchableOpacity
              onPress={() => onAddToCart && onAddToCart(product)}
              style={styles.qtyBtn}
            >
              <Ionicons name="add" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 335,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  ageText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: "800",
  },
  favoriteCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  imageBox: {
    height: 125,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  detailsBox: {
    flex: 1,
    justifyContent: "space-between",
  },
  assuredRow: {
    height: 18,
    justifyContent: "center",
    marginBottom: 2,
  },
  assuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  assuredText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  specsText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ratingGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  reviewsCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    flexWrap: "wrap",
  },
  finalPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
    marginRight: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
});