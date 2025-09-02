import type { updateStatusPayload } from "./appointmentAPI";
import axiosClient from "./axiosClient";

export type FacilityDashBoardResponse = {
  totalCount: number;
  data: Staff[];
};

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
};

export type CreateStaffPayload = {
  AccountName : string;
  Email: string;
  Password: string;
  FullName: string;
  Phone: string;
  Position: string;
  Description: string;
  Age: number;
  Specialization: string;
  CertificationFile: File | null;
  University: string;
  Bio: string;
};

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
};

export const FacilityStaffAPI = {
  getAllStaff: async (
    facilityId: number,
    position: string,
    pageIndex: number,
    pageSize: number
  ): Promise<FacilityDashBoardResponse> => {
    return await axiosClient.get(`api/FacilityStaff`, {
      params: {
        facilityId,
        position,
        pageIndex,
        pageSize,
      },
    });
  },

  createStaff: async (staffData: CreateStaffPayload): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("AccountName", staffData.AccountName);
    formData.append("Email", staffData.Email);
    formData.append("Password", staffData.Password);
    formData.append("FullName", staffData.FullName);
    formData.append("Phone", staffData.Phone);
    formData.append("Position", staffData.Position);
    formData.append("Description", staffData.Description || "");
    formData.append("Age", staffData.Age.toString());
    formData.append("Specialization", staffData.Specialization || "");
    if (staffData.CertificationFile) {
      formData.append("CertificationFile", staffData.CertificationFile);
    }
    formData.append("University", staffData.University || "");
    formData.append("Bio", staffData.Bio || "");

    return await axiosClient.post(`api/auth/create-staff`, formData,  {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateStaff: async (staffData: UpdateStaffPayload): Promise<{ message: string }> => {
    return await axiosClient.put(`api/auth/update-facility-staff-info`, staffData);
  },
};