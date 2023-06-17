var express = require("express");
var request = require("request");
var cors = require("cors");
var app = express();
var cookieParser = require("cookie-parser");
var axios = require("axios");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.get("/get_current_user", async function (req, res) {
  console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    res.status(400).send("access_token is required");
    return;
  }
  let result = await axios.get(
    "https://secure.splitwise.com/api/v3.0/get_current_user",
    {
      headers: { Authorization: req.headers.authorization },
    }
  );
  const ans = {};
  if (result.data?.user) {
    ans.id = result.data.user.id;
    ans.name =
      result.data.user.first_name +
      " " +
      (result.data.user.last_name
        ? result.data.user.last_name.slice(0, 1)
        : "");
  }
  res.send(ans);
});

app.get("/get_friends", async function (req, res) {
  // console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    res.status(400).send("access_token is required");
    return;
  }
  let result = await axios.get(
    "https://secure.splitwise.com/api/v3.0/get_friends",
    {
      headers: { Authorization: req.headers.authorization },
    }
  );
  const ans = [];

  if (result.data?.friends) {
    result.data.friends.map((friend) => {
      ans.push({
        id: friend.id,
        name:
          friend.first_name +
          " " +
          (friend.last_name ? friend.last_name.slice(0, 1) : ""),
      });
    });
  }
  res.send(ans);
});

app.post("/create_expense", async function (req, res) {
  // console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    res.status(400).send("access_token is required");
    return;
  }
  //console.log(req.body);
  let result = await axios.get(
    "https://secure.splitwise.com/api/v3.0/create_expense",
    {
      headers: { Authorization: req.headers.authorization },
      params: req.body.expense,
    }
  );
  console.log("test");
  console.log(result.data);
  res.send(result.data);
});

app.listen(3001);
console.log("Server running on port %d", 3001);
