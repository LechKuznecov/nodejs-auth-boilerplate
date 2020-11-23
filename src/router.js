const express = require("express");
const router = express.Router();
const con = require("./db");
const middleware = require("./middleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.send("This boilerplate is working!");
});

router.get("/hidden", middleware.isLoggedIn, (req, res) => {
  res.send("This is hidden information!!");
});

router.post("/login", (req, res) => {
  const username = req.body.username.toLowerCase();
  con.query(
    `SELECT * FROM users WHERE username = '${username}'`,
    (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else {
        bcrypt.compare(
          req.body.password,
          result[0].password,
          (bErr, bResult) => {
            if (bErr || !bResult) {
              res.status(400).json({ msg: "Password or username incorrect" });
            } else {
              if (bResult) {
                const token = jwt.sign(
                  {
                    userId: result[0].id,
                    username: result[0].username,
                  },
                  process.env.SECRET_KEY,
                  {
                    expiresIn: "7d",
                  }
                );
                con.query(
                  `UPDATE users 
                    SET last_login_date = now() 
                    WHERE id = '${result[0].id}'`
                );

                res.status(200).json({
                  msg: "Logged In",
                  token,
                });
              }
            }
          }
        );
      }
    }
  );
});

router.post("/register", middleware.validateRegistration, (req, res) => {
  const username = req.body.username.toLowerCase();
  con.query(
    `SELECT * FROM users WHERE username = '${username}'`,
    (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else if (result.length !== 0) {
        res.status(400).json({ msg: "Username already taken" });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            res.status.json(err);
          } else {
            con.query(
              `INSERT INTO users (username, password, registration_date) VALUES ('${username}', '${hash}', now())`,
              (err, result) => {
                if (err) {
                  res.status(400).json(err);
                } else {
                  res.status(201).json({ msg: "User succesfully added" });
                }
              }
            );
          }
        });
      }
    }
  );
});

module.exports = router;
