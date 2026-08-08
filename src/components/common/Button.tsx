import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  iconName?: keyof typeof Ionicons.glyphMap;
  iconRightName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  iconName,
  iconRightName,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      styles.button,
      sizeStyles[size],
      variantStyles[variant],
    ];

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || loading) baseStyle.push(styles.disabled);
    if (style) baseStyle.push(style);

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseText: TextStyle[] = [
      styles.text,
      sizeTextStyles[size],
      variantTextStyles[variant],
    ];

    if (disabled) baseText.push(styles.disabledText);
    if (textStyle) baseText.push(textStyle);

    return baseText;
  };

  const getIconColor = (): string => {
    if (disabled) return Colors.textMuted;
    switch (variant) {
      case "outline":
      case "ghost":
        return Colors.primary;
      case "secondary":
        return Colors.secondary;
      case "primary":
      case "danger":
      case "success":
      default:
        return Colors.white;
    }
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : (
        <View style={styles.contentRow}>
          {iconName && (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={getIconColor()}
              style={{ marginRight: 6 }}
            />
          )}

          <Text style={getTextStyle()}>{title}</Text>

          {iconRightName && (
            <Ionicons
              name={iconRightName}
              size={iconSize}
              color={getIconColor()}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  md: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  lg: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 12, fontWeight: "700" },
  md: { fontSize: 14, fontWeight: "700" },
  lg: { fontSize: 16, fontWeight: "800" },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  secondary: {
    backgroundColor: Colors.secondaryLight,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  success: {
    backgroundColor: Colors.success,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: { color: Colors.white },
  secondary: { color: Colors.secondary },
  outline: { color: Colors.primary },
  ghost: { color: Colors.primary },
  danger: { color: Colors.white },
  success: { color: Colors.white },
});

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  text: {
    textAlign: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
