import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CATEGORIES as MOCK_CATEGORIES,
  PRODUCTS as MOCK_PRODUCTS,
  BANNERS as MOCK_BANNERS,
  Product,
  Category,
  Banner,
} from "../constants/mockData";

// Dynamic API Base URL:
// - iOS Simulator / Web: http://localhost:5001/api
// - Android Emulator: http://10.0.2.2:5001/api
// - Physical Android Device (WiFi): http://192.23.1.52:5001/api
export const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.226.185.65:5001/api"   // ← Your machine's LAN IP for physical device
    : "http://localhost:5001/api";


// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Storage keys for persistent authentication
let authToken: string | null = null;
const TOKEN_KEY = "@tinytots_auth_token";
const USER_KEY = "@tinytots_user_profile";

export const getAuthToken = () => authToken;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
  } else {
    delete api.defaults.headers.common["Authorization"];
    AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    AsyncStorage.removeItem(USER_KEY).catch(() => {});
  }
};

export const saveStoredUser = async (user: any) => {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (err) {}
};

export const getStoredUser = async () => {
  try {
    const val = await AsyncStorage.getItem(USER_KEY);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    return null;
  }
};

// Initialize token on app boot
AsyncStorage.getItem(TOKEN_KEY)
  .then((storedToken) => {
    if (storedToken) {
      setAuthToken(storedToken);
    }
  })
  .catch(() => {});


// Response Interceptor for cleaner error debugging (suppresses expected 401 unauthenticated warnings)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Ignore expected 401 unauthorized errors from log spam
      if (error.response.status !== 401) {
        console.warn(`[API ${error.config?.method?.toUpperCase()} ${error.config?.url}] Error:`, error.response.data);
      }
    } else if (error.request) {
      console.warn(`[API Network Error] Unable to reach ${API_BASE_URL}`);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. HEALTH CHECK API
// ==========================================
export const checkAPIHealth = async () => {
  try {
    const res = await api.get("/health");
    return res.data;
  } catch (error) {
    return { status: "offline", error };
  }
};

// ==========================================
// 2. CATEGORIES API
// ==========================================
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const res = await api.get("/categories");
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return MOCK_CATEGORIES;
  } catch (error) {
    console.warn("⚠️ API offline: Returning fallback categories");
    return MOCK_CATEGORIES;
  }
};

export const fetchCategoryById = async (id: string) => {
  try {
    const res = await api.get(`/categories/${id}`);
    return res.data?.data;
  } catch (error) {
    return MOCK_CATEGORIES.find((c) => c.id === id) || null;
  }
};

// ==========================================
// 3. BANNERS API
// ==========================================
export const fetchBanners = async (): Promise<Banner[]> => {
  try {
    const res = await api.get("/banners");
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return MOCK_BANNERS;
  } catch (error) {
    console.warn("⚠️ API offline: Returning fallback banners");
    return MOCK_BANNERS;
  }
};

// ==========================================
// 4. PRODUCTS API
// ==========================================
export const fetchProducts = async (params?: {
  category?: string;
  search?: string;
  isDealOfDay?: boolean;
}): Promise<Product[]> => {
  try {
    const res = await api.get("/products", { params });
    if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data;
    }
    return MOCK_PRODUCTS;
  } catch (error) {
    console.warn("⚠️ API offline: Returning fallback products");
    return MOCK_PRODUCTS;
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data?.data || null;
  } catch (error) {
    return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  }
};

export const fetchDealsOfTheDay = async (): Promise<Product[]> => {
  try {
    const res = await api.get("/products/deals-of-the-day");
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return MOCK_PRODUCTS.filter((p) => p.isDealOfDay);
  } catch (error) {
    return MOCK_PRODUCTS.filter((p) => p.isDealOfDay);
  }
};

export interface CartCalculationResult {
  items: Array<{ product: Product; quantity: number; itemTotal: number }>;
  totalItemsCount: number;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  finalTotal: number;
  promoApplied: { code: string; discountPercent: number; discountAmount: number } | null;
}

export const calculateCartAPI = async (payload: {
  items: Array<{ productId: string; quantity: number }>;
  promoCode?: string;
}): Promise<CartCalculationResult> => {
  try {
    const res = await api.post("/cart/calculate", payload);
    return res.data.data;
  } catch (error) {
    let subtotal = 0;
    const detailedItems: any[] = [];
    payload.items.forEach((item) => {
      const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      if (prod) {
        const itemTotal = prod.price * item.quantity;
        subtotal += itemTotal;
        detailedItems.push({ product: prod, quantity: item.quantity, itemTotal });
      }
    });

    const discountAmount = payload.promoCode ? Math.min(subtotal * 0.2, 200) : 0;
    return {
      items: detailedItems,
      totalItemsCount: payload.items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      discountAmount,
      deliveryFee: 0,
      finalTotal: Math.max(0, subtotal - discountAmount),
      promoApplied: payload.promoCode
        ? { code: payload.promoCode, discountPercent: 20, discountAmount }
        : null,
    };
  }
};

export const fetchCartAPI = async () => {
  try {
    const res = await api.get("/cart");
    return res.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const updateCartAPI = async (items: Array<{ productId: string; quantity: number }>) => {
  try {
    const res = await api.put("/cart", { items });
    return res.data?.data || [];
  } catch (error) {
    return items;
  }
};

export const clearCartAPI = async () => {
  try {
    const res = await api.delete("/cart");
    return res.data;
  } catch (error) {
    return { success: true };
  }
};

// ==========================================
// 6. ORDERS API
// ==========================================
export interface OrderPayload {
  customerName?: string;
  address?: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: string;
}

export const placeOrderAPI = async (orderPayload: OrderPayload) => {
  try {
    const res = await api.post("/orders", orderPayload);
    return res.data;
  } catch (error: any) {
    console.warn("⚠️ Order API offline fallback:", error?.message);
    const mockOrderId = "TT-" + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      message: "Order placed successfully! (Offline Mode)",
      data: {
        id: mockOrderId,
        orderId: mockOrderId,
        customerName: orderPayload.customerName || "Madhumathi",
        address: orderPayload.address || "Coimbatore, Tamil Nadu",
        totalAmount: 1897,
        status: "Confirmed",
        estimatedDelivery: "Tomorrow by 5:00 PM",
      },
    };
  }
};

export const fetchMyOrdersAPI = async () => {
  try {
    const res = await api.get("/orders/my-orders");
    return res.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const fetchOrderByIdAPI = async (orderId: string) => {
  try {
    const res = await api.get(`/orders/${orderId}`);
    return res.data?.data || null;
  } catch (error) {
    return null;
  }
};

// ==========================================
// 7. AUTHENTICATION & USER PROFILE API
// ==========================================
export const sendOtpAPI = async (phone: string) => {
  try {
    const res = await api.post("/auth/send-otp", { phone });
    return res.data;
  } catch (error: any) {
    // Demo fallback for smooth UI testing
    return {
      success: true,
      message: "OTP sent successfully! (Demo OTP: 1234)",
      data: { phone, otp: "1234" },
    };
  }
};

export const verifyOtpAPI = async (phone: string, otp: string) => {
  try {
    const res = await api.post("/auth/verify-otp", { phone, otp });
    if (res.data?.data?.token) {
      setAuthToken(res.data.data.token);
      if (res.data?.data?.user) {
        await saveStoredUser(res.data.data.user);
      }
    }
    return res.data;
  } catch (error: any) {
    // Demo fallback for smooth offline / UI verification
    if (otp === "1234") {
      const mockToken = "demo_jwt_token_" + Date.now();
      const mockUser = {
        name: `Kids Club Member (${phone.slice(-4)})`,
        email: `user_${phone.slice(-4)}@tinytots.app`,
        phone: phone.startsWith("+") ? phone : `+91 ${phone.slice(-10)}`,
        pincode: "641001",
        sparksBalance: 680,
        role: "customer",
      };
      setAuthToken(mockToken);
      await saveStoredUser(mockUser);
      return {
        success: true,
        message: "OTP verified & login successful! (Demo Mode)",
        data: { user: mockUser, token: mockToken },
      };
    }
    throw error?.response?.data || { message: "Invalid OTP. Use demo OTP: 1234" };
  }
};

export const loginAPI = async (email: string, password: string) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.data?.token) {
      setAuthToken(res.data.data.token);
      if (res.data?.data?.user) {
        await saveStoredUser(res.data.data.user);
      }
    }
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};

export const registerAPI = async (userPayload: {
  name: string;
  email: string;
  password: string;
  pincode?: string;
  phone?: string;
}) => {
  try {
    const res = await api.post("/auth/register", userPayload);
    if (res.data?.data?.token) {
      setAuthToken(res.data.data.token);
      if (res.data?.data?.user) {
        await saveStoredUser(res.data.data.user);
      }
    }
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};


export const fetchUserProfileAPI = async () => {
  const defaultProfile = {
    name: "Madhumathi",
    email: "madhu@example.com",
    phone: "+91 98765 43210",
    pincode: "641001",
    role: "admin",
    sparksBalance: 680,
  };

  if (!authToken) {
    return defaultProfile;
  }

  try {
    const res = await api.get("/profile");
    return res.data?.data || defaultProfile;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setAuthToken(null);
    }
    return defaultProfile;
  }
};

export const fetchSparksRewardsAPI = async () => {
  const defaultSparks = {
    sparksBalance: 680,
    multiplier: "2X on Kids Fest",
    tier: "TinyTots VIP Member",
  };

  if (!authToken) {
    return defaultSparks;
  }

  try {
    const res = await api.get("/profile/sparks");
    return res.data?.data || defaultSparks;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setAuthToken(null);
    }
    return defaultSparks;
  }
};

// ==========================================
// 8. NOTIFICATIONS API
// ==========================================
export const fetchNotificationsAPI = async () => {
  try {
    const res = await api.get("/notifications");
    return res.data?.data || [];
  } catch (error) {
    return [
      {
        id: 1,
        title: "🎉 TinyTots Kids Festival is LIVE!",
        message: "Up to 50% OFF on Party Wear, Frocks & Suits.",
        type: "promo",
        time: "2h ago",
      },
      {
        id: 2,
        title: "📦 Order Shipped!",
        message: "Your order #TT-84920 has been dispatched via Express.",
        type: "order",
        time: "5h ago",
      },
      {
        id: 3,
        title: "⭐ 680 Sparks Credited",
        message: "Sparks credited to your TinyTots VIP Kids Club Account.",
        type: "rewards",
        time: "1d ago",
      },
    ];
  }
};

export const markNotificationAsReadAPI = async (id: number) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  } catch (error) {
    return { success: true };
  }
};

export const updateProfileAPI = async (profileData: any) => {
  try {
    const res = await api.put("/profile", profileData);
    return res.data?.data;
  } catch (error) {
    return profileData;
  }
};

// ==========================================
// UNIFIED SERVICE OBJECT EXPORT
// ==========================================
export const MarketService = {
  checkAPIHealth,
  // Categories
  fetchCategories,
  fetchCategoryById,
  // Banners
  fetchBanners,
  // Products
  fetchProducts,
  fetchProductById,
  fetchDealsOfTheDay,
  // Cart
  calculateCart: calculateCartAPI,
  fetchCart: fetchCartAPI,
  updateCart: updateCartAPI,
  clearCart: clearCartAPI,
  // Orders
  placeOrder: placeOrderAPI,
  fetchMyOrders: fetchMyOrdersAPI,
  fetchOrderById: fetchOrderByIdAPI,
  // Auth & Profile
  sendOtp: sendOtpAPI,
  verifyOtp: verifyOtpAPI,
  login: loginAPI,
  register: registerAPI,
  fetchProfile: fetchUserProfileAPI,
  updateProfile: updateProfileAPI,
  fetchSparksRewards: fetchSparksRewardsAPI,
  getAuthToken,
  setAuthToken,
  saveStoredUser,
  getStoredUser,

  // Notifications
  fetchNotifications: fetchNotificationsAPI,
  markNotificationAsRead: markNotificationAsReadAPI,
};

export default api;


