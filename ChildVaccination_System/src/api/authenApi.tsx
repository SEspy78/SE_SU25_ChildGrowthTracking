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
    staffId:number;
    position:string;
    facilityId:number;
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




export type Member = {
  memberId: number;
  accountId: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  accountName: string;
  email: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberListResponse = {
  totalCount: number;
  data: Member[];
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
        token: response.token,
        position:response.position,
        facilityId: response.facilityId,
        }, 3600000)

            return response
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Đăng nhập thất bại.")
    }
    },

    getAllMember: async (): Promise<MemberListResponse> => {
        return await axiosClient.get("api/auth/members?pageIndex=1&pageSize=10");
    },

    register: async (data: RegisterPayload) => {
        const response = await axiosClient.post("api/Auth/register", data);
        return response; 
    },

    

    };
