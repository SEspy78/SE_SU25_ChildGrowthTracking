import axiosClient from "./axiosClient";

export interface ScheduleSlot {
  slotId: number;
  facilityId: number;
  facilityName: string;
  workingHoursGroupId: number | null;
  slotTime: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number;
  status: string;
  isWorkingHours: boolean;
  createdAt: string;
  updatedAt: string;
  slotNumber: number;
}

export interface ScheduleSlotResponse {
  data: ScheduleSlot[];
}

export const scheduleApi = {
  getAllScheduleSlot: async (): Promise<ScheduleSlotResponse> => {
    return await axiosClient.get(`api/ScheduleSlots/my-facility`);
  },
};