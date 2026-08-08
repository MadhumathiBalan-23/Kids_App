export interface Category {
  id: string;
  name: string;
  iconName: string;
  iconFamily: "Ionicons" | "MaterialCommunityIcons" | "FontAwesome5";
  bgColor: string;
  badge?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  isAssured?: boolean;
  discount: string;
  ageGroup: string;
  isDealOfDay?: boolean;
  freeDelivery?: boolean;
  specifications: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  code: string;
  bannerImageUrl: string;
  bgColor: string;
  iconName: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "all",
    name: "All Items",
    iconName: "grid-outline",
    iconFamily: "Ionicons",
    bgColor: "#EBF3FA",
  },
  {
    id: "girls",
    name: "Girls Wear",
    iconName: "human-female-girl",
    iconFamily: "MaterialCommunityIcons",
    bgColor: "#FFEBF0",
    badge: "Cute Frocks",
  },
  {
    id: "boys",
    name: "Boys Wear",
    iconName: "human-male-boy",
    iconFamily: "MaterialCommunityIcons",
    bgColor: "#E6F0FA",
    badge: "Smart Suits",
  },
  {
    id: "baby",
    name: "Baby & Infant",
    iconName: "baby-carriage",
    iconFamily: "MaterialCommunityIcons",
    bgColor: "#FFF8E7",
    badge: "0-12M",
  },
  {
    id: "footwear",
    name: "Kids Shoes",
    iconName: "shoe-sneaker",
    iconFamily: "MaterialCommunityIcons",
    bgColor: "#EBFDF3",
    badge: "LED Shoes",
  },
  {
    id: "toys",
    name: "Toys & Plush",
    iconName: "teddy-bear",
    iconFamily: "MaterialCommunityIcons",
    bgColor: "#F5EEF8",
    badge: "Soft Toys",
  },
];

export const BANNERS: Banner[] = [
  {
    id: "b1",
    title: "KIDS FASHION FESTIVAL",
    subtitle: "Flat 50% OFF on Party Wear, Frocks & Suits",
    tag: "SPECIAL SALE",
    code: "KIDS50",
    bannerImageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80",
    bgColor: "#FF6B8B",
    iconName: "sparkles",
  },
  {
    id: "b2",
    title: "NEWBORN CARE WEEK",
    subtitle: "Buy 2 Get 1 FREE on Baby Onesies & Rompers",
    tag: "BABY SPECIAL",
    code: "BABYFREE",
    bannerImageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80",
    bgColor: "#4A90E2",
    iconName: "gift",
  },
  {
    id: "b3",
    title: "LIGHT-UP SHOES & TOYS",
    subtitle: "Extra 20% OFF on Kids Footwear & Plush Toys",
    tag: "TOY ZONE",
    code: "TOYS20",
    bannerImageUrl: "https://images.unsplash.com/photo-1558060370-d644479be6e7?w=600&q=80",
    bgColor: "#FFC048",
    iconName: "rocket",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Pink Floral Princess Party Dress",
    category: "girls",
    price: 799,
    originalPrice: 1299,
    rating: 4.9,
    reviewsCount: 1420,
    imageUrl: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&q=80",
    isAssured: true,
    discount: "38% off",
    ageGroup: "Age 2 - 6 Years",
    isDealOfDay: true,
    freeDelivery: true,
    specifications: "100% Breathable Cotton Lining | Bow Knot",
  },
  {
    id: "p2",
    name: "Gentleman Bowtie Suit Set (3-Pcs)",
    category: "boys",
    price: 1199,
    originalPrice: 1899,
    rating: 4.8,
    reviewsCount: 980,
    imageUrl: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&q=80",
    isAssured: true,
    discount: "36% off",
    ageGroup: "Age 3 - 8 Years",
    isDealOfDay: true,
    freeDelivery: true,
    specifications: "Includes Blazer, White Shirt & Trousers",
  },
  {
    id: "p3",
    name: "Cute Bunny Cotton Newborn Onesie Set",
    category: "baby",
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviewsCount: 2310,
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80",
    isAssured: true,
    discount: "37% off",
    ageGroup: "Age 0 - 12 Months",
    isDealOfDay: true,
    freeDelivery: true,
    specifications: "Super Soft Organic Cotton | Snap Buttons",
  },
  {
    id: "p4",
    name: "Traditional Designer Silk Lehenga Choli",
    category: "girls",
    price: 1499,
    originalPrice: 2499,
    rating: 4.7,
    reviewsCount: 840,
    imageUrl: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&q=80",
    isAssured: true,
    discount: "40% off",
    ageGroup: "Age 4 - 10 Years",
    isDealOfDay: false,
    freeDelivery: true,
    specifications: "Festive Embroidered Silk with Dupatta",
  },
  {
    id: "p5",
    name: "LED Light-Up Sneaker Shoes for Kids",
    category: "footwear",
    price: 899,
    originalPrice: 1399,
    rating: 4.8,
    reviewsCount: 1650,
    imageUrl: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&q=80",
    isAssured: true,
    discount: "35% off",
    ageGroup: "Age 3 - 9 Years",
    isDealOfDay: true,
    freeDelivery: true,
    specifications: "Rechargeable 7-Color LED Sole | Anti-Slip",
  },
  {
    id: "p6",
    name: "Casual Denim Jacket & Cargo Trousers Combo",
    category: "boys",
    price: 999,
    originalPrice: 1599,
    rating: 4.7,
    reviewsCount: 720,
    imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80",
    isAssured: true,
    discount: "37% off",
    ageGroup: "Age 4 - 9 Years",
    isDealOfDay: false,
    freeDelivery: true,
    specifications: "Soft Denim Fabric | Stylish Utility Pockets",
  },
  {
    id: "p7",
    name: "Fluffy Plush Giant Teddy Bear (40 cm)",
    category: "toys",
    price: 599,
    originalPrice: 999,
    rating: 4.9,
    reviewsCount: 3120,
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479be6e7?w=400&q=80",
    isAssured: true,
    discount: "40% off",
    ageGroup: "All Ages",
    isDealOfDay: true,
    freeDelivery: true,
    specifications: "Non-Toxic Washable Fabric | Ultra Soft",
  },
  {
    id: "p8",
    name: "Summer Cotton Printed T-Shirt & Shorts",
    category: "boys",
    price: 399,
    originalPrice: 699,
    rating: 4.6,
    reviewsCount: 1450,
    imageUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80",
    isAssured: true,
    discount: "42% off",
    ageGroup: "Age 1 - 5 Years",
    isDealOfDay: false,
    freeDelivery: true,
    specifications: "Cool Cartoon Print | Elastic Waistband",
  },
];
