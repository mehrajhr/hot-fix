
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/utility/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connectionString: process.env.CONNECTION_STRING,
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    email VARCHAR(35) UNIQUE NOT NULL ,
    password TEXT NOT NULL,
    role VARCHAR(15) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()

    )
    `);
    await pool.query(`
       CREATE TABLE IF NOT EXISTS issues(
       id SERIAL PRIMARY KEY,
       title VARCHAR(150) NOT NULL ,
       description TEXT NOT NULL CHECK (char_length(description) >= 20),
       type VARCHAR(17) NOT NULL CHECK (type IN ('bug' , 'feature_request')),
       status VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open' , 'in_progress' , 'resolved')),
       reporter_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
       ) 
        `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";

// src/types/index.ts
var userRoles = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/auth/auth.service.ts
var createUserInDB = async (payload) => {
  const { name, email, password, role } = payload;
  if (role && role !== userRoles.contributor && role !== userRoles.maintainer) {
    throw new AppError(
      400,
      "Invalid role . Role must be contributor or maintainer"
    );
  }
  const hashPassword = await bcrypt.hash(password, 15);
  const result = await pool.query(
    `
    INSERT INTO users(name , email , password , role) VALUES ($1 , $2 , $3 , COALESCE($4 , 'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  if (!payload) {
    throw new AppError(400, "Invalid input");
  }
  const { email, password } = payload;
  if (!email || !password) {
    throw new AppError(400, "Both email and password are required");
  }
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );
  if (userData.rowCount === 0) {
    throw new AppError(401, "Invalid credentials!");
  }
  const user = userData.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, "Invalid credentials!");
  }
  const jwtPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  const accesstoken = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: config_default.expiresIn || "1h"
  });
  delete user.password;
  return { accesstoken, user };
};
var authService = {
  createUserInDB,
  loginUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    erroors: data.errors
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signUpUser = async (req, res) => {
  try {
    const result = await authService.createUserInDB(req.body);
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: result.accesstoken,
        user: result.user
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var authController = {
  signUpUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUpUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/utility/formatSingleIssue.ts
var formatSingleIssue = async (issue) => {
  if (!issue) {
    return null;
  }
  const reporterID = issue.reporter_id;
  const findReporter = await pool.query(
    `
          SELECT id, name, role FROM users WHERE id=$1
          `,
    [reporterID]
  );
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
      role: reporter?.role
    },
    created_at: issue?.created_at,
    updated_at: issue?.updated_at
  };
};
var formatSingleIssue_default = formatSingleIssue;

// src/modules/issues/issues.service.ts
var issueTypes = ["bug", "feature_request"];
var issueStatus = ["in_progress", "open", "resolved"];
var createIssuesInDB = async (id, payload) => {
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
    [title, description, type, status, id]
  );
  return result;
};
var getAllIssuesFromDB = async (payload) => {
  const { sort, status, type } = payload;
  const sortType = sort === "newest" ? "DESC" : "ASC";
  const result = await pool.query(
    `
  SELECT * FROM issues 
  WHERE ($1::varchar IS NULL OR type = $1)
    AND ($2::varchar IS NULL OR status = $2)
  ORDER BY created_at ${sortType}
  `,
    [type, status]
  );
  const issuesData = result.rows;
  const promises = issuesData.map((issue) => {
    return formatSingleIssue_default(issue);
  });
  const newIssuesData = await Promise.all(promises);
  return newIssuesData;
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Issue not found");
  }
  const issue = result.rows[0];
  const formatedIssue = await formatSingleIssue_default(issue);
  return formatedIssue;
};
var updateIssueInDB = async (isssueId, userId, userRole, payload) => {
  const issue = await pool.query(
    `
    SELECT status , reporter_id FROM issues WHERE id=$1
    `,
    [isssueId]
  );
  if (issue.rowCount === 0) {
    throw new AppError(404, "Issue not found");
  }
  const { status, reporter_id } = issue.rows[0];
  if (userId !== reporter_id && userRole !== userRoles.maintainer) {
    throw new AppError(
      403,
      "Access Forbidden! You can only update your own issues."
    );
  }
  if (userId === reporter_id && status !== "open" && userRole !== userRoles.maintainer) {
    throw new AppError(
      403,
      "Access Forbidden! You can only update your own open issues."
    );
  }
  const { title, description, type, status: updatedStatus } = payload;
  const result = await pool.query(
    `
    UPDATE issues SET title=COALESCE($1 , title), description = COALESCE($2, description), type = COALESCE($3, type), status = COALESCE($4, status), updated_at = NOW() WHERE id=$5 RETURNING *
    `,
    [title, description, type, updatedStatus, isssueId]
  );
  return result.rows[0];
};
var deleteIssueInDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id]
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Issue not found");
  }
  return result;
};
var isssuesService = {
  createIssuesInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueInDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    const id = req.user.id;
    const result = await isssuesService.createIssuesInDB(id, req.body);
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const type = req.query?.type || null;
    const status = req.query?.status || null;
    const sort = req.query?.sort || "newest";
    const queries = {
      sort,
      type,
      status
    };
    const result = await isssuesService.getAllIssuesFromDB(queries);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived succesfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Something went wrong"
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await isssuesService.getSingleIssueFromDB(id);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Data retrived succesfully",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var updateIssue = async (req, res) => {
  const { id: issueId } = req.params;
  const { id: userId, role: userRole } = req.user;
  try {
    const result = await isssuesService.updateIssueInDB(
      issueId,
      userId,
      userRole,
      req.body
    );
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await isssuesService.deleteIssueInDB(id);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Something went wrong" : error.message;
    return sendResponse_default(res, {
      statusCode,
      success: false,
      message
    });
  }
};
var issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!"
      });
    }
    const decoded = jwt2.verify(
      token,
      config_default.secret
    );
    if (!decoded?.email) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!"
      });
    }
    const userData = await pool.query(
      `
        SELECT * FROM users WHERE email=$1
        `,
      [decoded?.email]
    );
    if (userData.rowCount === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "User not found"
      });
    }
    if (roles.length && !roles.includes(decoded?.role)) {
      return sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Access Forbidden!"
      });
    }
    req.user = decoded;
    next();
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(userRoles.contributor, userRoles.maintainer),
  issuesController.createIssues
);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(userRoles.contributor, userRoles.maintainer),
  issuesController.updateIssue
);
router2.delete("/:id", auth_default(userRoles.maintainer), issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "This is hotfix server "
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map