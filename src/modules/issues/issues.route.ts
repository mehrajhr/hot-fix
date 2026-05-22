import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { userRoles } from "../../types";

const router = Router();

router.post("/",auth(userRoles.maintainer), issuesController.createIssues);

export const issuesRoute = router;
