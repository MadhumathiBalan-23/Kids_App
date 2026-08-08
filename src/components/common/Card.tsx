import React, { ReactNode } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import Colors from "../../constants/Colors";

export interface CardProps {
  children: ReactNode;
  variant?: "elevated" | "outlined" | "flat";
  padding?: number;
  borderRadius?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = "outlined",
  padding = 12,
  borderRadius = 14,
  onPress,
  style,
}: CardProps) {
  const Container = onPress ? TouchableOpacity : View;

  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [
      styles.card,
      { padding, borderRadius },
      variantStyles[variant],
    ];

    if (style) base.push(style);
    return base;
  };

  return (
    <Container
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={getContainerStyle()}
    >
      {children}
    </Container>
  );
}

const variantStyles = StyleSheet.create({
  elevated: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flat: {
    backgroundColor: Colors.background,
  },
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
