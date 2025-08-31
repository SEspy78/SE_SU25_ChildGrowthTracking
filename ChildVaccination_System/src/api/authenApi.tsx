    import axiosClient from "./axiosClient";
    import { setItemWithExpiry } from "@/lib/storage";

    export type LoginPayload = {
    accountName: string;
    password: string;
    };


    export type response = {
    message: string;
    success: boolean;

    }


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

export type Child = {
    childId: number;
    accountId: number;
    fullName: string;
    birthDate: string;
    bloodType:string;
     gender: string;
    allergiesNotes:string;
    medicalHistory:string;
    imageURL:string;
    status:boolean;
    createdAt: string;
    updatedAt: string;
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
        fullName: response.fullName,
        staffId: response.staffId,
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

    getMemberChildren: async (accountId: number): Promise<Child[]> => {
        return await axiosClient.get(`api/Children/admin/account/${accountId}`);
    },

    register: async (data: RegisterPayload) => {
        const response = await axiosClient.post("api/Auth/register", data);
        return response; 
    },
     

    sendMail: async (memberId: number) => {
        const response: response = await axiosClient.post(`api/ThankYouEmail/send/${memberId}?includeStatistics=true`);
        return response;
    }

};
