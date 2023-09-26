import dotenv from "dotenv";
import cors from "cors";
import express, { Request, Response } from "express";
import expressJSDocSwagger from "express-jsdoc-swagger";

import swaggerOptions from "./routes/docs";
import adminRouter from "./routes/admin";
import emailRouter from "./routes/email";
import contactRouter from "./routes/contact";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());

expressJSDocSwagger(app)(swaggerOptions);

app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.use("/admin", adminRouter);
app.use("/email", emailRouter);
app.use("/contact", contactRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
