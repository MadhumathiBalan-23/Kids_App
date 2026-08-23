import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

interface HeaderProps {
  cartCount: number;
  onOpenCart?: () => void;
  onOpenNotifications?: () => void;
  onOpenAuth?: () => void;
  onOpenDeliveryTracking?: () => void;
  userName?: string;
  pincode?: string;
  sparksBalance?: number;
  unreadNotifCount?: number;
}

export default function Header({
  cartCount = 0,
  onOpenCart,
  onOpenNotifications,
  onOpenAuth,
  onOpenDeliveryTracking,
  userName = "Madhumathi",
  pincode = "641001",
  sparksBalance = 680,
  unreadNotifCount = 3,
}: HeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {/* Brand Top Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <MaterialCommunityIcons name="crown" size={24} color={Colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.brandTitle}>TinyTots</Text>
          <View style={styles.vipPill}>
            <Text style={styles.vipText}>Kids Club</Text>
          </View>
        </View>

        {/* Right Header Controls */}
        <View style={styles.rightActions}>
          <TouchableOpacity activeOpacity={0.8} style={styles.sparkleBox}>
            <Ionicons name="star" size={14} color={Colors.accent} style={{ marginRight: 3 }} />
            <Text style={styles.starCount}>{sparksBalance}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenNotifications}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
            {unreadNotifCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onOpenCart}
            style={styles.cartBtn}
          >
            <Ionicons name="bag-handle-outline" size={24} color={Colors.white} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Clean & Simple Delivery Bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onOpenDeliveryTracking || onOpenAuth}
        style={styles.deliverySubBar}
      >
        <View style={styles.deliveryLeftGroup}>
          <Ionicons name="location-sharp" size={14} color={Colors.accent} style={{ marginRight: 5 }} />
          <Text numberOfLines={1} style={styles.deliverText}>
            Deliver to <Text style={{ fontWeight: "800" }}>{userName}'s Home</Text> • {pincode}
          </Text>
        </View>

        <View style={styles.rightExpressGroup}>
          <View style={styles.timerBadge}>
            <Ionicons name="flash" size={10} color={Colors.primary} style={{ marginRight: 2 }} />
            <Text style={styles.timerBadgeText}>1-Day Express</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.white} style={{ marginLeft: 2 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingTop: 4,
    paddingBottom: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 48,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: -0.6,
  },
  vipPill: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  vipText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.black,
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  sparkleBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  starCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  iconBtn: {
    marginRight: 12,
    position: "relative",
    padding: 4,
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  cartBtn: {
    position: "relative",
    padding: 4,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: Colors.accent,
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.8,
    borderColor: Colors.primary,
  },
  cartBadgeText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: "900",
  },
  deliverySubBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
  },
  deliveryLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationPinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  deliverText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  deliverySubText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  rightExpressGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  timerBadgeText: {
    color: Colors.primary,
    fontSize: 9.5,
    fontWeight: "900",
  },
});