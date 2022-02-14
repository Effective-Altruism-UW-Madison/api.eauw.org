import { Router } from "express";
import session from "express-session";
import bodyParser from "body-parser";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ensureLoggedIn } from "connect-ensure-login";

import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { postEmailQueue } from "./queues/postEmail.queue";

const router = Router();

passport.use(
  new LocalStrategy((username, password, callback) => {
    if (
      username === process.env.BOARD_USER &&
      password === process.env.BOARD_PASS
    ) {
      return callback(null, { user: "bull-board" });
    }
    return callback(null, false);
  })
);

passport.serializeUser((user, callback) => {
  callback(null, user);
});

passport.deserializeUser((user: null | any, callback) => {
  callback(null, user);
});

router.use(
  session({
    secret: process.env.BOARD_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true
  })
);

router.use(bodyParser.urlencoded({ extended: true }));

router.use(passport.initialize());
router.use(passport.session());

router.get("/", ensureLoggedIn({ redirectTo: "/admin/login" }), (req, res) => {
  res.redirect("/admin/dashboard");
});

router.get("/login", (req, res) => {
  res.render("login", { invalid: req.query.invalid });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/admin/login?invalid=true",
    successReturnToOrRedirect: "/admin/dashboard"
  })
);

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [new BullAdapter(postEmailQueue)],
  serverAdapter
});

serverAdapter.setBasePath("/admin/dashboard");

router.use(
  "/dashboard",
  ensureLoggedIn({ redirectTo: "/admin/login" }),
  serverAdapter.getRouter()
);

export default router;
