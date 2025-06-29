    import axiosClient from "./axiosClient";
    import { setItemWithExpiry } from "@/lib/storage";

    export type LoginPayload = {
    accountName: string;
    password: string;
    };


    export type AccountResponse = {
    accountId: number;
    accountName: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    address: string | null;
    role: "Admin" | "Doctor" | "Staff" | string; 
    status: boolean;
    token: string;
    };

    type RegisterPayload = {
    username: string;
    password: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    gender: string;
    dateOfBirth: string; 
    };




    export const authApi = {
    login: async (data: LoginPayload) =>{
    try {
        const response: AccountResponse = await axiosClient.post("api/Auth/login", data)

        if (!response.status) throw new Error("Tài khoản bị khóa.")

        setItemWithExpiry("userInfo", {
        accountId: response.accountId,
        accountName: response.accountName,
        role: response.role,
        token: response.token
        }, 3600000)

        return response
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Đăng nhập thất bại.")
    }
    },



    register: async (data: RegisterPayload) => {
        const response = await axiosClient.post("api/Auth/register", data);
        return response; 
    },

    };
