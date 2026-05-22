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

export const issuesController = {
  createIssues,
  getAllIssues,
};
