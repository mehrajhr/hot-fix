import express, { type Application } from "express";

const app: Application = express();
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "This is hotfix server ",
  });
});

export default app;
