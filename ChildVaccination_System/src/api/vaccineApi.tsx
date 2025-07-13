import axiosClient from "./axiosClient";

export interface Vaccine {
  vaccineId: number;
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  ageGroup: string;
  numberOfDoses: number;
  minIntervalBetweenDoses: number;
  sideEffects: string;
  contraindications: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  diseases: any[]; 
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


export const vaccineApi = {
  getAll: async (): Promise<Vaccine[]> => {
    return await axiosClient.get("api/Vaccines");
  },

  getById: async (id: number) => {
    const response: Vaccine = await axiosClient.get(`api/Vaccines/${id}`);
    return response;
  },
};

export interface FacilityVaccineResponse {
  totalCount: number;
  data: FacilityVaccine[];
}

export interface CreateFacilityVaccineRequest {
  facilityId: number;
  vaccineId: number;
  price: number;
  availableQuantity: number;
  batchNumber: 0;
  expiryDate: string; 
  importDate: string;
  status: string; 
}



export const facilityVaccineApi = {
      getAll: async (id: number) => {
   const res :FacilityVaccineResponse = await axiosClient.get(`api/FacilityVaccines?facilityId=${id}`);
  return res;
  },
getById: async (id: number) => {
   const res :FacilityVaccineResponse = await axiosClient.get(`api/FacilityVaccines?facilityId=${id}`);
  return res;
  },
 create: async (payload: CreateFacilityVaccineRequest): Promise<FacilityVaccine> => {
    return  await axiosClient.post("api/FacilityVaccines", payload);
  }

}