import axiosClient from "./axiosClient";


export type PayloadPayment = {
  appointmentId: number;
};

export type PaymentResponse = {
  success: boolean;
  message: string;
  data: {
    paymentUrl: string;
    orderCode: string;
    amount:number;
    status: string;
    appointmentId: number;
    paymentType: string;
    description: string;
    orderId: number;
    transactionId: number;
  };
}
export type FinishPaymentResponse = {
  success: boolean;
  data: {
    status: string;
    message: string;
    amount: number;
    paidAt: string;
  };
};

export const FacilityPaymentAccountApi = {

  payment: async (data: PayloadPayment): Promise<PaymentResponse> => {
    return await axiosClient.post(`api/VaccinationFacilityPaymentAccount/payment-deploy`, data);
  },

  finishPayment: async (orderCode:string): Promise<FinishPaymentResponse> => {
    return await axiosClient.get(`api/VaccinationFacilityPaymentAccount/payment-status/${orderCode}`);
  },


}

