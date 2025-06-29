import axiosClient from "./axiosClient";



export type Disease = {
  diseaseId: number;
  name: string;
  description: string;
  symptoms: string;
  treatment: string;
};


export const diseaseApi = {
  getAll: async (): Promise<Disease[]> => {
    return await axiosClient.get("api/Diseases");
  },

  getById: async (id: number) => {
    const response: Disease = await axiosClient.get(`api/Diseases/${id}`);
    return response;
  },
};