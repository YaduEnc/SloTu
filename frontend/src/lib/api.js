import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

// In-memory access token (intentionally not in localStorage)
let accessToken = null;
let onUnauthorized = null;

export const tokenStore = {
  set(t) { accessToken = t; },
  get() { return accessToken; },
  clear() { accessToken = null; },
};

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // send refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((r) => {
        accessToken = r.data?.access_token || null;
        return accessToken;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    if (status === 401 && !original._retried) {
      original._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // refresh failed
      tokenStore.clear();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Helper: extract structured backend error
export function asApiError(err) {
  const data = err?.response?.data;
  if (data?.error) return data.error; // { code, message, details? }
  return {
    code: data?.code || "NETWORK_ERROR",
    message: data?.message || err?.message || "Something went wrong. Please try again.",
    details: {},
  };
}

export const auth = {
  sendOtp: (email) => api.post("/auth/otp/send", { email }).then((r) => r.data),
  verifyOtp: (request_id, email, otp) =>
    api.post("/auth/otp/verify", { request_id, email, otp }).then((r) => r.data),
  refresh: () => tryRefresh(),
  logout: () => api.post("/auth/logout").then((r) => r.data).catch(() => null),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const users = {
  updateMe: (payload) => api.patch("/users/me", payload).then((r) => r.data),
  becomeSeller: () => api.post("/users/become-seller").then((r) => r.data),
  setUpi: (upi_id) => api.post("/users/seller/upi", { upi_id }).then((r) => r.data),
};

export const listings = {
  listPublic: (params = {}) => api.get("/listings", { params }).then((r) => r.data),
  detail: (id) => api.get(`/listings/${id}`).then((r) => r.data),
  listMine: (params = {}) => api.get("/listings/me", { params }).then((r) => r.data),
  catalog: () => api.get("/listings/services/catalog").then((r) => r.data),
  create: (payload) => api.post("/listings", payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/listings/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/listings/${id}`).then((r) => r.data).catch(() => null),
};

export default api;
