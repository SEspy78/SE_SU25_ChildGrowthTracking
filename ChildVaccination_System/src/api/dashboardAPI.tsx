import axiosClient from "./axiosClient";



export type FacilityDashBoardResponse = {
  facilityId: number;
  totalFacilityVaccines: string;
  totalOrders: number;
  totalPackageVaccines: number;
  averageRating: number;
  revenueStats: {
    paidRevenue: number;
    pendingOrdersCount: number;
  };
  staffCounts: {
    totalStaffs: number;
    totalManagers: number;
    totalDoctors: number;
  };
  appointmentStats: {
    totalAppointments: number;
    packageAppointments: number;
    individualAppointments: number;
    pending: number;
    completed: number;
    approval: number;
    cancelled: number;
    paid: number;
    uniqueChildrenVaccinated: number;
  };
};


export type AdminDashboardResponse = {
    totalFacilities:number;
    totalChildren:number;
    totalMembershipPackages:number;
    totalUserMemberships:number;
    totalRevenueFromMemberships:number;
    totalGrowthRecords:number;
    appointmentStats :{
       totalAppointments:number;
       packageAppointments:number;
       individualAppointments:number;
       pending:number;
       completed:number;
       approval:number;
       cancelled:number;
       paid:number;
       uniqueChildrenVaccinated:number;
    }




}



export const DashBoardAPI = {
  facilityDashboard: async (facilityId: number): Promise<FacilityDashBoardResponse> => {
    return await axiosClient.get(`api/facility/${facilityId}/dashboard`);
  },
  

  adminDashboard: async (): Promise<AdminDashboardResponse> => {
    return await axiosClient.get(`api/admin/dashboard`);
  }

  
};