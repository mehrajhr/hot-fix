import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { userRoles } from "../../types";

const router = Router();

router.post(
  "/",
  auth(userRoles.contributor, userRoles.maintainer),
  issuesController.createIssues,
);
router.get("/", issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id",auth(userRoles.contributor, userRoles.maintainer), issuesController.updateIssue);

export const issuesRoute = router;
