import type { IssueStatus, IssueType } from "../../types";

export interface IIssues {
  title: string;
  description: string;
  type: IssueType;
  status?: IssueStatus;
}

export interface IQueriesAllIssue {
  sort: string;
  type: string | null;
  status: string | null;
}
