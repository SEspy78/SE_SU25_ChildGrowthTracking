

import axiosClient from "./axiosClient";

export type AppointmentResponse = {
  appointments: Appointment[];
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  todayCount: number;
};

export type Appointment = {
  appointmentId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  note: string;
  memberId: number;
  memberName: string;
  memberPhone: string;
  memberEmail: string;
  child: Child;
  orderId: number | null;
  order: Order | null;
  facilityVaccines: FacilityVaccine[];
  appointmentDate: string;
  appointmentTime: string;
  slotTime: string;
  estimatedCost: number;
  isUpcoming: boolean;
  isPast: boolean;
  canApprove: boolean;
  canReject: boolean;
  canComplete: boolean;
};

export type Child = {
  childId: number;
  memberId: number;
  fullName: string;
  birthDate: string;
  gender: string;
  bloodType: string;
  allergiesNotes: string;
  medicalHistory: string;
  status: boolean;
  createdAt: string;
  updateAt: string;
};

export type Order = {
  orderId: number;
  memberId: number;
  packageId: number;
  packageName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  member: Member;
  orderDetails: OrderDetail[];
};

export type OrderDetail = {
  orderDetailId: number;
  orderId: number;
  facilityVaccineId: number;
  diseaseId: number;
  remainingQuantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  memberId: number;
  accountId: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  accountName: string | null;
  email: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FacilityVaccine = {
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
};

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
  diseases: any[];
};

export type updateStatusPayload = {
  status: string;
  note: string;
};

export type finishVaccinationPayload = {
  appointmentId: number;
  facilityVaccineId: number;
  note: string;
  doseNumber: number;
  expectedDateForNextDose: string;
};

export type GetOrderResponse = {
  totalCount: number;
  data: Order[];
};


export const appointmentApi = {
  getAllAppointments: async (pageIndex: number = 1, pageSize: number = 10): Promise<AppointmentResponse> => {
    return await axiosClient.get(`api/FacilityAppointment?&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getAppointmentById: async (facilityId: number): Promise<AppointmentResponse> => {
    return await axiosClient.get(`api/FacilityAppointment/${facilityId}`);
  },
  updateAppointmentStatus: async (appointmentId: number, payload: updateStatusPayload): Promise<any> => {
    return await axiosClient.put(`api/FacilityAppointment/${appointmentId}/status`, payload);
  },
  completeVaccination: async (payload: finishVaccinationPayload): Promise<any> => {
    return await axiosClient.post(`api/ChildVaccineProfiles/complete-vaccination`, payload);
  },
};

export const orderApi = {
  getAllOrder: async ( facilityId: number ,status: string, pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },

   getAllOrderPaid: async ( facilityId: number ,status: string = "Paid", pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
   getAllOrderPending: async ( facilityId: number ,status: string = "Pending", pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },

  getAllOrderAdmin: async ( status: string, pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    return await axiosClient.get(`api/Order/${orderId}`);
  }
}