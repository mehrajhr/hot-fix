import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUserInDB(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    console.log(error);
    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: message,
    });
  }
};

export const authController = {
  signUpUser,
};
