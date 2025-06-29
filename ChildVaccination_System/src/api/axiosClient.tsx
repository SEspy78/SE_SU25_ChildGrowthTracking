import axios from "axios";
 import {getItemWithExpiry } from "@/lib/storage";
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
});

axiosClient.interceptors.response.use(
 (response) => {
    if (response.status === 200) {
      return response.data;
    }

    return response;
  },
  (error) => {
    const { response } = error;

    if (!response) {
      return Promise.reject({
        message: "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.",
      });
    }

    const status = response.status;

    if (status === 400) {
      return Promise.reject({
        message: response.data,
        status,
      });
    }

    if (status === 401 || status === 403) {
      return Promise.reject({
        message: "Bạn không có quyền thực hiện hành động này.",
        status,
      });
    }

    if (status === 404) {
      return Promise.reject({
        message: "Không tìm thấy tài nguyên.",
        status,
      });
    }

    if (status === 500) {
      return Promise.reject({
        message:
          response.data?.message ||
          "Lỗi máy chủ. Vui lòng thử lại sau.",
        status,
      });
    }
    return Promise.reject({
      message: "Lỗi không xác định.",
      status,
    });
  }
);

axiosClient.interceptors.request.use((config) => {
  const userInfo = getItemWithExpiry("userInfo");
  const token = typeof userInfo === "string" ? JSON.parse(userInfo)?.token : userInfo?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



export default axiosClient;
