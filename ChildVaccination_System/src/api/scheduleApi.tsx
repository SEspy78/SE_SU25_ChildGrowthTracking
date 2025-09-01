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


export interface BulkWorkingHoursRequest {
  facilityId:number | undefined;
  workingHoursGroupId:number | null;
  date:string;
  status: string;
}
 

export type CreateScheduleSlotRequest = {
      startTime:string,
      endTime:string,
      slotDurationMinutes:number,
      lunchBreakStart:string,
      lunchBreakEnd:string,
      maxCapacity:number,
      status:string,
      isWorkingHours:boolean,
}



export interface ScheduleSlotResponse {
  data: ScheduleSlot[];
}

export const scheduleApi = {
  getAllScheduleSlot: async (): Promise<ScheduleSlotResponse> => {
    return await axiosClient.get(`api/ScheduleSlots/my-facility`);
  },

   createScheduleSlot: async (request: CreateScheduleSlotRequest): Promise<any> => {
    return await axiosClient.post(`api/ScheduleSlots`, request);
  },

  BulkWorkingHours: async (request: BulkWorkingHoursRequest): Promise<any> => {
    return await axiosClient.post(`api/AppointmentSchedules/bulk-assign-working-hours`, request);
  }
}