import bcrypt from "bcryptjs";
import { AppError } from "../../utility/AppError";
import type { Iuser } from "./auth.interface";
import { pool } from "../../db";

const createUserInDB = async (payload: Iuser) => {
  const { name, email, password, role } = payload;
  if (role && role !== "contributor" && role !== "maintainer") {
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

export const authService = {
  createUserInDB,
};
