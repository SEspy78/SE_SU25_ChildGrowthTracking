import axiosClient from "./axiosClient";


export type  ChildRespoinse = {
  childId: number;
  memberId: number;
  fullName: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VaccineProfile ={
  vaccineProfileId: number; 
    childId: number;
    diseaseId: number;
    appointmentId: number;
    vaccineId: number;
   doseNum: number;
   expectedDate: string;
   actualDate: string;
   status: string;
   isRequired: boolean;
   priority:string;
   note: string;
   createdAt: string;
   updatedAt: string;
}



export const childprofileApi = {
    getChildById: async (childId: number): Promise<ChildRespoinse> => {
        return await axiosClient.get(`api/Children/public/${childId}`);
    },

    getChildVaccineProfile: async (childId: number): Promise<VaccineProfile[]> => {
        return await axiosClient.get(`api/ChildVaccineProfiles/public/child/${childId}`);
    }
}