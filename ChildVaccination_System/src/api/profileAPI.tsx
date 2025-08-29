import axiosClient from "./axiosClient";




export type StaffResponse = {
    staffId: number;
    fullName: string;
    phone: string;
    email: string;
    position: string;
    description: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}


export type UpdateStaffPayload = {
    fullName?: string;
    phone?: string;
    email?: string;
    position?: string;
    description?: string;
    status?: boolean;
}

export const ProfileApi = {
    getStaffById: async (staffId: number): Promise<StaffResponse> => {
        return await axiosClient.get(`api/FacilityStaff/${staffId}`);
    },

   updateStaff: async (staffId: number, data: UpdateStaffPayload): Promise<StaffResponse> => {
       return await axiosClient.put(`api/FacilityStaff/${staffId}`, data);
   }
    
}

