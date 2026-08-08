import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";
import Colors from "../constants/Colors";
import { BANNERS } from "../constants/mockData";

const { width } = Dimensions.get("window");

interface BannerSliderProps {
  onClaimPromo?: (code: string) => void;
}

export default function BannerSlider({ onClaimPromo }: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeIndex && slide >= 0 && slide < BANNERS.length) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            onPress={() => onClaimPromo && onClaimPromo(banner.code)}
            style={[styles.bannerCard, { backgroundColor: banner.bgColor }]}
          >
            <View style={styles.contentLeft}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{banner.tag}</Text>
              </View>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>
              <View style={styles.ctaBtn}>
                <Text style={styles.ctaText}>Shop Now ▶</Text>
              </View>
            </View>

            <View style={styles.imageRight}>
              <Image
                source={{ uri: banner.bannerImageUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Indicator Dots */}
      <View style={styles.dotsRow}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  bannerCard: {
    width: width - 28,
    height: 148,
    marginHorizontal: 14,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
  contentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  tagBadge: {
    backgroundColor: Colors.accent,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    color: Colors.black,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  title: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 23,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "500",
  },
  ctaBtn: {
    backgroundColor: Colors.white,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  ctaText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: "800",
  },
  imageRight: {
    width: 105,
    height: 105,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 5,
    backgroundColor: Colors.border,
  },
});
