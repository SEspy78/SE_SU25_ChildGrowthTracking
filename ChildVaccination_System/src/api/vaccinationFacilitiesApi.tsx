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
};


export type GetAllFacilitiesResponse = {
  success: boolean;
  message: string;
  data: Facility[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
};


export const facilityApi = {
  getAll: async () => {
    const res :GetAllFacilitiesResponse = await axiosClient.get("api/VaccinationFacilities?pageIndex=1&pageSize=10");
    return res ;
  },
};