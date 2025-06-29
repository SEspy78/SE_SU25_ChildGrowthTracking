import axiosClient from "./axiosClient";

export type Vaccine = {
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
  diseaseIds: number[];
};

export const vaccineApi = {
  getAll: async (): Promise<Vaccine[]> => {
    return await axiosClient.get("api/Vaccines");
  },

  getById: async (id: number) => {
    const response: Vaccine = await axiosClient.get(`api/Vaccines/${id}`);
    return response;
  },
};
