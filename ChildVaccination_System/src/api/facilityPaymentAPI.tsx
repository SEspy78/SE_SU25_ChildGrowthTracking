import axiosClient from "./axiosClient";

export type AllPaymentAccountResponse = {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  data: PaymentAccount[];
};

export type PaymentAccount = {
  id: number;
  facilityId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrcodeImageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PayloadCreateAccount = {
  facilityId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  QrcodeImage : File;
  isActive: boolean;
};

export const FacilityPaymentAccountApi = {
  getAllAccount: async (pageIndex: number, pageSize: number): Promise<AllPaymentAccountResponse> => {
    return await axiosClient.get(`api/VaccinationFacilityPaymentAccount`, {
      params: {
        pageIndex,
        pageSize,
      },
    });
  },

  createAccount: async (data: FormData): Promise<any> => {
    return await axiosClient.post(`api/VaccinationFacilityPaymentAccount`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
   
  deleteAccount: async (accountId:number): Promise<any> => {
    return await axiosClient.delete(`api/VaccinationFacilityPaymentAccount/${accountId}`)
  }

}

