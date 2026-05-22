export const userRoles = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type Roles = "contributor" | "maintainer";
export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";
