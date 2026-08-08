import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

export type TabType = "home" | "categories" | "notifications" | "profile" | "cart";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount?: number;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  cartCount = 0,
}: BottomNavProps) {
  const tabs = [
    {
      id: "home",
      label: "Home",
      activeIcon: "home-sharp" as const,
      inactiveIcon: "home-outline" as const,
    },
    {
      id: "categories",
      label: "Categories",
      activeIcon: "grid-sharp" as const,
      inactiveIcon: "grid-outline" as const,
    },
    {
      id: "notifications",
      label: "Alerts",
      activeIcon: "notifications-sharp" as const,
      inactiveIcon: "notifications-outline" as const,
    },
    {
      id: "profile",
      label: "Account",
      activeIcon: "person-sharp" as const,
      inactiveIcon: "person-outline" as const,
    },
    {
      id: "cart",
      label: "Cart",
      activeIcon: "bag-handle-sharp" as const,
      inactiveIcon: "bag-handle-outline" as const,
      badge: cartCount,
    },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const iconName = isActive ? tab.activeIcon : tab.inactiveIcon;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onTabChange(tab.id as TabType)}
            style={[styles.tabItem, isActive && styles.activeTabItem]}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={iconName}
                size={21}
                color={isActive ? Colors.primary : Colors.textSecondary}
              />
              {tab.badge && tab.badge > 0 ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 60,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
    position: "relative",
  },
  activeTabItem: {
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  iconContainer: {
    position: "relative",
  },
  badgePill: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: Colors.accent,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.black,
    fontSize: 9,
    fontWeight: "900",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: "800",
  },
  labelInactive: {
    color: Colors.textSecondary,
  },
});
