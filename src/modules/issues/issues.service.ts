import type { IIssues } from "./issues.interface";

const createIssuesInDB = async (payload: IIssues) => {
  const { title, description, type, status } = payload;
};

export const isssuesService = {
  createIssuesInDB,
};
