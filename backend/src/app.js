import express from "express";
import cors from "cors";
import cookie_Parser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(express.static("public"));

app.use(cookie_Parser());

import authRouter from "./routes/auth.routes.js";
import roleRouter from "./routes/role.routes.js";
import userRouter from "./routes/user.routes.js";
import permissionRouter from "./routes/permission.routes.js";
import batchRouter from "./routes/batch.routes.js";
import programRouter from "./routes/program.routes.js";
import assignmentRouter from "./routes/assignment.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import moduleRouter from "./routes/module.routes.js";
import attendanceRouter from "./routes/attendance.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import collegeRouter from "./routes/college.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/permissions", permissionRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/batches", batchRouter);
app.use("/api/v1/programs", programRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/resources", resourceRouter);
app.use("/api/v1/modules", moduleRouter);
app.use("/api/v1/attendance", attendanceRouter); // attendance not attedances
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/colleges", collegeRouter);

import { errorHandler } from "./middlewares/error.middlewares.js";

app.use(errorHandler);

export { app };
