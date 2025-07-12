
import axiosClient from "./axiosClient";
import type { Vaccine } from "./vaccineApi";


export interface Disease {
  diseaseId: number;
  name: string;
  description: string;
  symptoms: string;
  treatment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaccinePackageRequest {
  facilityId: number;
  name: string;
  description: string;
  duration: number;
  status: string;
  vaccines: Array<{
    facilityVaccineId: number;
    quantity: number;
  }>;
}

export interface FacilityVaccine {
  facilityVaccineId: number;
  facilityId: number;
  vaccineId: number;
  price: number;
  availableQuantity: number;
  batchNumber: number;
  expiryDate: string;
  importDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vaccine: Vaccine; 
}

export interface PackageVaccine {
  packageVaccineId: number;
  packageId: number;
  facilityVaccineId: number;
  facilityVaccine: FacilityVaccine;
  diseaseId: number;
  disease: Disease;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaccinePackage {
  packageId: number;
  facilityId: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  packageVaccines: PackageVaccine[];
}

export interface VaccinePackageResponse {
  totalCount: number;
  data: VaccinePackage[];
}

export const vaccinePackageApi = {
  getAll: async (id : number): Promise<VaccinePackageResponse> => {
    return await axiosClient.get(`api/VaccinePackages?facilityId=${id}`);
  }
  ,
  create: async (payload: CreateVaccinePackageRequest): Promise<any> => {
    return await axiosClient.post("api/VaccinePackages", payload);
  }
};