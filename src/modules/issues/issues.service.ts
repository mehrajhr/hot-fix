import { pool } from "../../db";
import type { IssueStatus, IssueType } from "../../types";
import { AppError } from "../../utility/AppError";
import formatSingleIssue from "../../utility/formatSingleIssue";
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
  const promises = issuesData.map((issue) => {
    return formatSingleIssue(issue);
  });

  const newIssuesData = await Promise.all(promises);

  // console.log(newIssuesData)

  return newIssuesData;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "Issue not found");
  }

  const issue = result.rows[0];

  const formatedIssue = await formatSingleIssue(issue);

  // console.log(formatedIssue)

  return formatedIssue;
};

export const isssuesService = {
  createIssuesInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
};
