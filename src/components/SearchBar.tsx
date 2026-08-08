import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value = "",
  onChangeText,
  onFilterPress,
  placeholder = "Search party frocks, suits, shoes & toys...",
}: SearchBarProps) {
  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          returnKeyType="search"
        />

        {value.length > 0 ? (
          <TouchableOpacity
            onPress={() => onChangeText && onChangeText("")}
            style={styles.iconAction}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightIconsRow}>
            <TouchableOpacity style={styles.iconAction}>
              <Ionicons name="camera-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconAction}>
              <Ionicons name="mic-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  rightIconsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconAction: {
    padding: 3,
    marginLeft: 4,
  },
});