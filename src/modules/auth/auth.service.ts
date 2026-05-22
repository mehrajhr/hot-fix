import bcrypt from "bcryptjs";
import { AppError } from "../../utility/AppError";
import type { ILoginPayload, Iuser } from "./auth.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken";
import config from "../../config";
import { userRoles } from "../../types";

const createUserInDB = async (payload: Iuser) => {
  const { name, email, password, role } = payload;
  if (role && role !== userRoles.contributor && role !== userRoles.maintainer) {
    throw new AppError(
      400,
      "Invalid role . Role must be contributor or maintainer",
    );
  }

  const hashPassword = await bcrypt.hash(password, 15);

  const result = await pool.query(
    `
    INSERT INTO users(name , email , password , role) VALUES ($1 , $2 , $3 , COALESCE($4 , 'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;
  return result;
};

const loginUserIntoDB = async (payload: ILoginPayload) => {
  if (!payload) {
    throw new AppError(400, "Invalid input");
  }
  //   console.log(payload);

  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError(400, "Both email and password are required");
  }

  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email],
  );

  if (userData.rowCount === 0) {
    throw new AppError(401, "Invalid credentials!");
  }

  const user = userData.rows[0];
  //   console.log(user);

  const passwordMatch = await bcrypt.compare(password, user.password);
  //   console.log(passwordMatch);

  if (!passwordMatch) {
    throw new AppError(401, "Invalid credentials!");
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accesstoken = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: (config.expiresIn || "1h") as any,
  });
  delete user.password;
  return { accesstoken, user };
};

export const authService = {
  createUserInDB,
  loginUserIntoDB,
};
