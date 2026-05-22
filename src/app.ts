import express, { type Application } from "express";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "This is hotfix server ",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);

export default app;
