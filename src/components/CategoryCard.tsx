import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { Category } from "../constants/mockData";

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export default function CategoryCard({
  category,
  isSelected = false,
  onSelect,
}: CategoryCardProps) {
  const renderVectorIcon = () => {
    const size = 26;
    const color = isSelected ? Colors.white : Colors.primary;

    if (category.iconFamily === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={category.iconName as any} size={size} color={color} />;
    }
    return <Ionicons name={category.iconName as any} size={size} color={color} />;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect && onSelect(category.id)}
      style={styles.cardContainer}
    >
      <View
        style={[
          styles.circleBorder,
          { backgroundColor: isSelected ? Colors.primary : category.bgColor },
          isSelected ? styles.circleSelected : styles.circleUnselected,
        ]}
      >
        {renderVectorIcon()}
      </View>

      <Text
        style={[
          styles.titleText,
          isSelected ? styles.titleSelected : styles.titleUnselected,
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    marginRight: 14,
    width: 64,
  },
  circleBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  circleSelected: {
    borderWidth: 2.5,
    borderColor: Colors.primaryDark,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  circleUnselected: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  titleText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center",
  },
  titleSelected: {
    color: Colors.primary,
    fontWeight: "800",
  },
  titleUnselected: {
    color: Colors.textPrimary,
  },
});