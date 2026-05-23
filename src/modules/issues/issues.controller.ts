import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { isssuesService } from "./issues.service";

const createIssues = async (req: Request, res: Response) => {
  try {
    const id = req.user.id;
    // console.log(id)
    const result = await isssuesService.createIssuesInDB(id, req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: message,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const type = (req.query?.type as string) || null;
    const status = (req.query?.status as string) || null;
    const sort = (req.query?.sort as string) || "newest";

    const queries = {
      sort,
      type,
      status,
    };

    //   console.log(queries)

    const result = await isssuesService.getAllIssuesFromDB(queries);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived succesfully",
      data: result,
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Something went wrong",
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await isssuesService.getSingleIssueFromDB(id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Data retrived succesfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: message,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  const { id: issueId } = req.params;
  const { id: userId, role: userRole } = req.user;
  // console.log(issueId , userId , userRole);
  try {
    const result = await isssuesService.updateIssueInDB(
      issueId as string,
      userId as string,
      userRole,
      req.body,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: message,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await isssuesService.deleteIssueInDB(id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: message,
    });
  }
};

export const issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
