import type { NextFunction, Request, Response } from "express";
import type { Roles } from "../types";
import sendResponse from "../utility/sendResponse";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (...roles: Roles[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    // console.log(token);

    if (!token) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!",
      });
    }

    const decoded = jwt.verify(
      token as string,
      config.secret as string,
    ) as JwtPayload;

    if (!decoded?.email) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!",
      });
    }

    // console.log(decoded);

    const userData = await pool.query(
      `
        SELECT * FROM users WHERE email=$1
        `,
      [decoded?.email],
    );

    if (userData.rowCount === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    if (roles.length && !roles.includes(decoded?.role)) {
      return sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "Access Forbidden!",
      });
    }

    req.user = decoded;
    next();
  };
};

export default auth;
