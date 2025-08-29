import axiosClient from "./axiosClient";

export type surveyResponse = {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  data: Question[];
};

export type AllSurveyResponse = {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  data: Survey[];
};

export type Survey = {
  surveyId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
};

export type Question = {
  questionId: number;
  questionText: string;
  questionType: string;
  isRequired: boolean;
};

export type createSurveyPayload = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type createQuestionPayload = {
  questionText: string;
  questionType: string;
  isRequired: boolean;
};

export type AnswerPayload = {
  questionId: number;
  answerId: number | null;
  answerText: string;
  temperatureC: number;
  heartRateBpm: number;
  systolicBpmmHg: number;
  diastolicBpmmHg: number;
  oxygenSatPercent: number;
  decisionNote: string;
  consentObtained: boolean;
};

export type QuestionResponse = {
  questionId: number;
  questionText: string;
  answerText: string;
};

export type AnswerResponse = {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  data: {
    appointmentId: number;
    submittedAt: string;
    temperatureC: number;
    heartRateBpm: number;
    systolicBpmmHg: number;
    diastolicBpmmHg: number;
    oxygenSatPercent: number;
    decisionNote: string;
    consentObtained: boolean;
    questions: QuestionResponse[];
  };
};


export type response=  {
   message: string;
   success: boolean;
}

export const surveyAPI = {
  getSurveybyId: async (surveyId: number): Promise<surveyResponse> => {
    return await axiosClient.get(`api/Survey/${surveyId}/questions`);
  },

  getAllSurveys: async (): Promise<AllSurveyResponse> => {
    return await axiosClient.get("api/Survey");
  },

  addQuestion: async (
    surveyId: number,
    payload: createQuestionPayload
  ): Promise<any> => {
    return await axiosClient.post(`api/Survey/${surveyId}/questions`, payload);
  },

  createSurvey: async (payload: createSurveyPayload): Promise<any> => {
    return await axiosClient.post("api/Survey", payload);
  },

  submitSurveyAnswer: async (
    appointmentId: number,
    answer: AnswerPayload[]
  ): Promise<response> => {
    return await axiosClient.post(`api/Survey/${appointmentId}/submit`, answer);
  },

  getSurveyResponse: async (appointmentId: number): Promise<AnswerResponse> => {
    return await axiosClient.get(`api/Survey/${appointmentId}/responses`);
  },

  deleteSurvey: async (surveyId: number): Promise<any> => {
    return await axiosClient.delete(`api/Survey/${surveyId}`);
  }
};
