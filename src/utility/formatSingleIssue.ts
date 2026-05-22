import { pool } from "../db";
import type { IIssues } from "../modules/issues/issues.interface";

interface ISingleIssue extends IIssues {
  id: number;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

const formatSingleIssue = async (issue: ISingleIssue) => {
  // console.log(issue)
  if (!issue) {
    return null;
  }
  const reporterID = issue.reporter_id;
  const findReporter = await pool.query(
    `
          SELECT id, name, role FROM users WHERE id=$1
          `,
    [reporterID],
  );

  // console.log(findReporter.rows[0]);
  const reporter = findReporter.rows[0];

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
};

export default formatSingleIssue;
