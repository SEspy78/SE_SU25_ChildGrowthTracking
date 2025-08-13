import type { updateStatusPayload } from "./appointmentAPI";
import axiosClient from "./axiosClient";


export type FacilityDashBoardResponse = {
 totalCount: number;
 data: Staff[];

}

export type Staff = {
staffId: number;
accountId: number;
facilityId: number;
fullName: string;
phone: string;
email: string;
position: string;
description: string;
status: boolean;
createdAt: string;
}

export type CreateStaffPayload = {
  accountName:string;
  email:string;
  password:string;
  fullName:string;
  phone:string;
  position:string;
  description:string;
  age:number;
  specialization:string;
  certifications:string;
  university:string;
  bio:string;
}


export type UpdateStaffPayload = {
  staffId: number;
  fullName?: string;
   phone?: string;
  email?: string;
  position?: string;
  description?: string;
  status?: boolean;
  age?: number;
  specialization?: string;
  certifications?: string;
  university?: string;
  bio?: string;
}

export const FacilityStaffAPI = {
  getAllStaff: async (facilityId: number, position: string ,pageIndex:number,pageSize:number): Promise<FacilityDashBoardResponse> => {
    return await axiosClient.get(`api/FacilityStaff`, {
      params: {
        facilityId,
        position,
        pageIndex,
        pageSize
      }
    });
  },

  createStaff: async (staffData: CreateStaffPayload): Promise<any> => {
    return await axiosClient.post(`api/auth/create-staff`, staffData);
  },

  updateStaff: async ( staffData: updateStatusPayload): Promise<any> => {
    return await axiosClient.put(`api/auth/update-facility-staff-info`, staffData);
  }

};