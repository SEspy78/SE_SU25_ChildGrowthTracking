import axiosClient from "./axiosClient";


export type  AppointmentResponse = {
  appointments: Appointment[];
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  todayCount: number;
}

export type  Appointment = {
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
  packageName: string;
  vaccineNames: string[];
  appointmentDate: string;
  appointmentTime: string;
  slotTime: string;
  estimatedCost: number;
  isUpcoming: boolean;
  isPast: boolean;
  canApprove: boolean;
  canReject: boolean;
  canComplete: boolean;
}

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
}

export type updateStatusPayload = {
  status: string;
  note: string;
};

export const appointmentApi = {
    getAllAppointments: async (): Promise<AppointmentResponse> => {
    return await axiosClient.get(`api/FacilityAppointment`);
  },
    getAppointmentById: async (facilityId: number): Promise<AppointmentResponse> => {
        return await axiosClient.get(`api/FacilityAppointment/${facilityId}`);
    },
    
    updateAppointmentStatus: async (appointmentId: number, payload:updateStatusPayload): Promise<any> => {
      return await axiosClient.put(`api/FacilityAppointment/${appointmentId}/status`, { payload });
    },
}