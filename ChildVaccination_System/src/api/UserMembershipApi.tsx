import axiosClient from "./axiosClient";

export type UserMembership = {
  userMembershipId: number;
  accountId: number;
  membershipId: number;
  startDate: string;
  endDate: string;
  status: boolean;
  remainingConsultations: number;
  lastRenewalDate: string;
  accountName: string;
  membershipName: string;
  membershipDescription: string;
  membershipPrice: number;
  membershipBenefits: string;
  isActive: boolean;
  daysRemaining: number;
};

export type UserMembershipListResponse = {
  totalCount: number;
  data: UserMembership[];
};

export const userMembershipApi = {
  getAll: async (pageIndex: number, pageSize: number): Promise<UserMembershipListResponse> => {
    return await axiosClient.get(
      `api/UserMemberships/all?pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  },
}; 