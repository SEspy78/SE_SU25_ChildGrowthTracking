import axiosClient from "./axiosClient";

export interface ScheduleSlot {
  slotId: number;
  facilityId: number;
  facilityName: string;
  slotTime: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  slotNumber: number;
}

export interface ScheduleSlotResponse {
  data: ScheduleSlot[];
}

export const scheduleApi = {
  getAllScheduleSlot: async (): Promise<ScheduleSlotResponse> => {
    return await axiosClient.get(`api/ScheduleSlots/my-facility}`);
  },
};