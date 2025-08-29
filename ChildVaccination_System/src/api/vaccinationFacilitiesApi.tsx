import axiosClient from "./axiosClient";

export type Facility = {
  facilityId: number;
  facilityName: string;
  licenseNumber: number;
  address: string;
  phone: number;
  email: string;
  description: string;
  status: number;
  createdAt: number;
  updatedAt: number;
  licenseFile: string;
};

export type GetAllFacilitiesResponse = {
  success: boolean;
  message: string;
  data: Facility[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
};

export type GetByIdFacilitiesResponse = {
  success: boolean;
  message: string;
  data: Facility ;
};

export type UpdateFacilityRequest = {
  facilityId: number;
  facilityName: string;
  licenseNumber: number;
  address: string;
  phone: number;
  email: string;
  description: string;
  status: boolean;
  licenseFile: File | null;
};

export type CreateFacilityRequest = {
  accountName: string;
  password: string;
  managerEmail: string;
  managerFullName: string;
  managerPhone: string;
  managerDescription: string;
  facilityName: string;
  licenseNumber: number;
  facilityAddress: string;
  facilityPhone: number;
  facilityEmail: string;
  facilityDescription: string;
};

export const facilityApi = {
  getAll: async () => {
    const res: GetAllFacilitiesResponse = await axiosClient.get("api/VaccinationFacilities?pageIndex=1&pageSize=10");
    return res;
  },

  getById: async (id: number) => {
    const response: GetByIdFacilitiesResponse = await axiosClient.get(`api/VaccinationFacilities/${id}`);
    return response;
  },

  update: async (facilityId: number, payload: UpdateFacilityRequest): Promise<GetByIdFacilitiesResponse> => {
    const formData = new FormData();
    formData.append("facilityId", payload.facilityId.toString());
    formData.append("facilityName", payload.facilityName);
    formData.append("licenseNumber", payload.licenseNumber.toString());
    formData.append("address", payload.address);
    formData.append("phone", payload.phone.toString());
    formData.append("email", payload.email);
    formData.append("description", payload.description || "");
    formData.append("status", payload.status ? "1" : "0");
    if (payload.licenseFile) {
      formData.append("licenseFile", payload.licenseFile);
    }
    return await axiosClient.put(`api/VaccinationFacilities/${facilityId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  createFacility: async (payload: CreateFacilityRequest): Promise<any> => {
    return await axiosClient.post(`api/auth/create-manager-with-facility`, payload);
  },
};






