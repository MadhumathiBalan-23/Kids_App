import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  rightIconName,
  onRightIconPress,
  isPassword = false,
  error,
  helperText,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  style,
  inputStyle,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.inputContainer];
    if (isFocused) base.push(styles.focusedContainer);
    if (error) base.push(styles.errorContainer);
    if (disabled) base.push(styles.disabledContainer);
    if (style) base.push(style);
    return base;
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={getContainerStyle()}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={isFocused ? Colors.primary : Colors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
        />

        {isPassword ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIconName ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons name={rightIconName} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  focusedContainer: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  errorContainer: {
    borderColor: Colors.danger,
  },
  disabledContainer: {
    backgroundColor: Colors.borderLight,
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    padding: 4,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  multilineInput: {
    height: "auto",
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
