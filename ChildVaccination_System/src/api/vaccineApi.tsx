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

export interface CreateVaccineRequest {
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
  diseaseIds: number[];
}


export const vaccineApi = {
  getAll: async (): Promise<Vaccine[]> => {
    return await axiosClient.get("api/Vaccines");
  },

  getById: async (id: number) => {
    const response: Vaccine = await axiosClient.get(`api/Vaccines/${id}`);
    return response;
  },
  create: async (payload: CreateVaccineRequest): Promise<Vaccine> => {
    return await axiosClient.post("api/Vaccines", payload);
  },

  delete: async (vaccineId:number  ): Promise<any> => {
    return await axiosClient.delete(`api/Vaccines/${vaccineId}`);
  },
  update: async (vaccineId: number, payload: CreateVaccineRequest): Promise<any> => {
    return await axiosClient.put(`api/Vaccines/${vaccineId}`, payload);
  }
   
};

export interface FacilityVaccineResponse1 {
  totalCount: number;
  data: FacilityVaccine[];
}


export interface CreateFacilityVaccineRequest {
  facilityId: number;
  vaccineId: number;
  price: number;
  availableQuantity: number;
  batchNumber: number;
  expiryDate: string; 
  importDate: string;
  status: string; 
}




export const facilityVaccineApi = {
      getAll: async (facilityId: number) => {
   const res :FacilityVaccineResponse1 = await axiosClient.get(`api/FacilityVaccines?facilityId=${facilityId}`);
  return res;
  },
getById: async (facilityVaccineid: number) => {
   const res :FacilityVaccine = await axiosClient.get(`api/FacilityVaccines/${facilityVaccineid}`);
  return res;
  },
 create: async (payload: CreateFacilityVaccineRequest): Promise<any> => {
    return  await axiosClient.post("api/FacilityVaccines", payload);
  },

  update: async (facilityVaccineId: number, payload: CreateFacilityVaccineRequest): Promise<FacilityVaccine> => {
    return await axiosClient.put(`api/FacilityVaccines/${facilityVaccineId}`, payload);
  }

}