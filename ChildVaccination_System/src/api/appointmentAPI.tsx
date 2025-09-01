import axiosClient from "./axiosClient";

export type AppointmentResponse = {
  appointments: Appointment[];
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  todayCount: number;
};

export type VaccinesToInject= { 
  facilityVaccineId: number;
  vaccineName: string;
  diseaseName: string;
  doseNumber: string;
  notes: string;
  manufacturer: string;
  sideEffects: string;
  contraindications: string;
}

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
  vaccinesToInject: VaccinesToInject[]
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

export type Disease = {
  diseaseId: number;
  name: string;
  description: string;
  symptoms: string;
  treatment: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderDetail = {
  orderDetailId: number;
  orderId: number;
  facilityVaccineId: number;
  facilityVaccine: FacilityVaccine;
  diseaseId: number;
  disease: Disease;
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
  nextFacilityVaccineId: number | null;
};

export type GetOrderResponse = {
  totalCount: number;
  data: Order[];
};

export type CancelAppointmentPayload = {
  currentAppointmentId: number;
  newScheduleId: number;
  childVaccineProfileId: number;
  cancelReason: string;
  note: string;
};

export type FacilityScheduleResponse = {
  facilityId: number;
  facilityName: string;
  fromDate: string;
  toDate: string;
  dailySchedules: DailySchedule[];
};

export type DailySchedule = {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  availableSlots: AvailableSlot[];
};

export type AvailableSlot = {
  scheduleId: number;
  slotId: number;
  slotTime: string;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  status: string;
  isBookable: boolean;
  bookingPercentage: number;
};

export type cancelResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export type UpdateOrderPayload = {
  selectedVaccines: {
    diseaseId: number;
    facilityVaccineId: number;
    quantity: number;
  }[];
};

export const appointmentApi = {
  getAllAppointments: async (pageIndex: number = 1, pageSize: number = 10, childName: string = ""): Promise<AppointmentResponse> => {
    return await axiosClient.get(`api/FacilityAppointment?&pageIndex=${pageIndex}&pageSize=${pageSize}&childName=${childName}`);
  },
    getAppointmentByDate: async (date: string, pageIndex: number = 1, pageSize: number = 10): Promise<AppointmentResponse> => {
      return await axiosClient.get(`api/FacilityAppointment/date?date=${date}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
    },

  getAppointmentByWeek: async (startOfWeek: string, pageIndex: number = 1, pageSize: number = 10): Promise<AppointmentResponse> => {
    return await axiosClient.get(`api/FacilityAppointment/week?startOfWeek=${startOfWeek}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getAppointmentById: async (appointmentId: number): Promise<Appointment> => {
    return await axiosClient.get(`api/FacilityAppointment/${appointmentId}`);
  },
  updateAppointmentStatus: async (appointmentId: number, payload: updateStatusPayload): Promise<any> => {
    return await axiosClient.put(`api/FacilityAppointment/${appointmentId}/status`, payload);
  },
  completeVaccination: async (payload: finishVaccinationPayload): Promise<any> => {
    return await axiosClient.post(`api/ChildVaccineProfiles/complete-vaccination`, payload);
  },
  getFacilitySchedule: async (facilityId: number, fromDate: string, toDate: string): Promise<FacilityScheduleResponse> => {
    return await axiosClient.get(`api/AppointmentBooking/facilities/${facilityId}/schedules?fromDate=${fromDate}&toDate=${toDate}`);
  },
  cancelAndReBook: async (payload: CancelAppointmentPayload): Promise<cancelResponse> => {
    return await axiosClient.post(`api/AppointmentBooking/cancel-and-rebook`, payload);
  }
};

export const orderApi = {
  getAllOrder: async (facilityId: number, status: string, pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getAllOrderPaid: async (facilityId: number, status: string = "Paid", pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getAllOrderPending: async (facilityId: number, status: string = "Pending", pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?facilityId=${facilityId}&status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getAllOrderAdmin: async (status: string, pageIndex: number = 1, pageSize: number = 10): Promise<GetOrderResponse> => {
    return await axiosClient.get(`api/Order?status=${status}&pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },
  getOrderById: async (orderId: number): Promise<Order> => {
    return await axiosClient.get(`api/Order/${orderId}`);
  },
  updateOrder: async (orderId: number, payload: UpdateOrderPayload): Promise<Order> => {
    return await axiosClient.put(`api/Order/${orderId}`, payload);
  }
};