import { pool } from "../../db";
import type { IssueStatus, IssueType } from "../../types";
import { AppError } from "../../utility/AppError";
import type { IIssues, IQueriesAllIssue } from "./issues.interface";

const issueTypes: IssueType[] = ["bug", "feature_request"];
const issueStatus: IssueStatus[] = ["in_progress", "open", "resolved"];

const createIssuesInDB = async (id: number, payload: IIssues) => {
  const { title, description, type, status } = payload;
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

const getAllIssuesFromDB = async (payload: IQueriesAllIssue) => {
  const { sort, status, type } = payload;
  const sortType = sort === "newest" ? "DESC" : "ASC";

  const result = await pool.query(
    `
  SELECT * FROM issues 
  WHERE ($1::varchar IS NULL OR type = $1)
    AND ($2::varchar IS NULL OR status = $2)
  ORDER BY created_at ${sortType}
  `,
    [type, status],
  );
  //   console.log(result);

  const issuesData = result.rows;
  const newIssuesData = issuesData.map(async (issue) => {
    const reporterID = issue.reporter_id;
    const findReporter = await pool.query(
      `
        SELECT * FROM users WHERE id=$1
        `,
      [reporterID],
    );

    const reporter = findReporter.rows[0];

    // console.log(findReporter.rows[0]);

    return {
      id: issue?.id,
      title: issue?.title,
      description: issue?.description,
      type: issue?.type,
      status: issue?.status,
      reporter: {
        id: reporter?.id,
        name: reporter?.name,
        role: reporter?.role,
      },
      created_at: issue?.created_at,
      updated_at: issue?.updated_at,
    };
  });

  return await Promise.all(newIssuesData);
};

export const isssuesService = {
  createIssuesInDB,
  getAllIssuesFromDB,
};
