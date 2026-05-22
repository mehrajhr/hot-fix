import { pool } from "../../db";
import type { IssueStatus, IssueType } from "../../types";
import { AppError } from "../../utility/AppError";
import sendResponse from "../../utility/sendResponse";
import type { IIssues } from "./issues.interface";

const createIssuesInDB = async (id: number, payload: IIssues) => {
  const { title, description, type, status } = payload;
  const issueTypes: IssueType[] = ["bug", "feature_request"];
  const issueStatus: IssueStatus[] = ["in_progress", "open", "resolved"];
  if (!issueTypes.includes(type)) {
    throw new AppError(400, "Invalid type input!");
  }
  if (status && !issueStatus.includes(status)) {
    throw new AppError(400, "Invalid status input");
  }
  const result = await pool.query(
    `
    INSERT INTO issues(title , description , type , status , reporter_id) VALUES ($1 , $2 , $3 , COALESCE($4 , 'open'), $5) RETURNING *
    `,
    [title, description, type, status, id],
  );

  //   console.log(result);

  return result;
};

export const isssuesService = {
  createIssuesInDB,
};
