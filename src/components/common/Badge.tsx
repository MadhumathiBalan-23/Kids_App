import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "accent" | "success" | "danger" | "outline";
  size?: "sm" | "md";
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = "primary",
  size = "md",
  iconName,
  onPress,
  style,
  textStyle,
}: BadgeProps) {
  const Container = onPress ? TouchableOpacity : View;

  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [
      styles.badge,
      sizeStyles[size],
      variantStyles[variant],
    ];

    if (style) base.push(style);
    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseText: TextStyle[] = [
      styles.text,
      sizeTextStyles[size],
      variantTextStyles[variant],
    ];

    if (textStyle) baseText.push(textStyle);
    return baseText;
  };

  const getIconColor = (): string => {
    switch (variant) {
      case "primary":
        return Colors.primary;
      case "secondary":
        return Colors.secondary;
      case "accent":
        return Colors.accent;
      case "success":
        return Colors.success;
      case "danger":
        return Colors.danger;
      case "outline":
      default:
        return Colors.textSecondary;
    }
  };

  const iconSize = size === "sm" ? 10 : 12;

  return (
    <Container
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={getContainerStyle()}
    >
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={getIconColor()}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={getTextStyle()}>{label}</Text>
    </Container>
  );
}

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  md: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 10, fontWeight: "700" },
  md: { fontSize: 11, fontWeight: "700" },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#FCE7F0",
  },
  secondary: {
    backgroundColor: Colors.secondaryLight,
    borderWidth: 1,
    borderColor: "#D0E4F7",
  },
  accent: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: "#FFE8B8",
  },
  success: {
    backgroundColor: "#E8F8F0",
    borderWidth: 1,
    borderColor: "#BCECD0",
  },
  danger: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: { color: Colors.primary },
  secondary: { color: Colors.secondary },
  accent: { color: "#D97706" },
  success: { color: Colors.success },
  danger: { color: Colors.danger },
  outline: { color: Colors.textSecondary },
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  text: {
    textAlign: "center",
  },
});
