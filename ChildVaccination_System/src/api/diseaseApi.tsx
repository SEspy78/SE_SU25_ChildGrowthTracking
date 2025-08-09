import axiosClient from "./axiosClient";



export type Disease = {
  diseaseId: number;
  name: string;
  description: string;
  symptoms: string;
  treatment: string;
};

export type DiseaseResponse = {
  data: Disease[];
};


export const diseaseApi = {
  getAll: async (): Promise<DiseaseResponse> => {
    return await axiosClient.get("api/Diseases");
  },
  
  getById: async (diseaseId: number): Promise<Disease> => {
    return await axiosClient.get(`api/Diseases/${diseaseId}`);
  },  
 
};