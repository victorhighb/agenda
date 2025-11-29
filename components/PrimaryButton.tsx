import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { COLORS } from "../theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  rightIconName?: React.ComponentProps<typeof Ionicons>["name"];
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  style,
  rightIconName,
  bgColor = COLORS.primary,
  textColor = COLORS.onPrimary,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, opacity: isDisabled ? 0.55 : 1 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {rightIconName && !loading && (
          <Ionicons
            name={rightIconName}
            size={20}
            color={textColor}
            style={styles.iconRight}
          />
        )}

        {loading && (
          <ActivityIndicator
            size="small"
            color={textColor}
            style={styles.iconRight}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14, 
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  iconRight: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});