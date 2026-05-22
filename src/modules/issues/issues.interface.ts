import type { issueStatus, issueType } from "../../types";

export interface IIssues {
  title: string;
  description: string;
  type: issueType;
  status?: issueStatus;
}
