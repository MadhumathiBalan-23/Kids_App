import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

interface CartBarProps {
  totalItems: number;
  totalPrice: number;
  onViewCart?: () => void;
}

export default function CartBar({
  totalItems,
  totalPrice,
  onViewCart,
}: CartBarProps) {
  if (totalItems === 0) return null;

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onViewCart}
        style={styles.pillBar}
      >
        <View style={styles.leftMeta}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalItems}</Text>
          </View>

          <View style={styles.priceMeta}>
            <Text style={styles.itemsLabel}>
              {totalItems} {totalItems === 1 ? "Item" : "Items"} selected
            </Text>
            <Text style={styles.totalPriceText}>Total: ₹{totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.white} style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    bottom: 68,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  pillBar: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  leftMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: Colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  countText: {
    color: Colors.black,
    fontWeight: "900",
    fontSize: 12,
  },
  priceMeta: {},
  itemsLabel: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
    fontWeight: "500",
  },
  totalPriceText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
