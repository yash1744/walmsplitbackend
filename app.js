var express = require("express");
const serverless = require("serverless-http");
var cors = require("cors");
var app = express();
var cookieParser = require("cookie-parser");
var axios = require("axios");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());


/**
 * Get /
 * @summary This is the summary of the endpoint
 * @return {object} 200 - An array of user info
 * @return {Error}  default - Unexpected error
 */
app.get("/", async function (req, res) {
  try {
    return res.status(200).json({ message: "Hello" });
  } catch (error) {
    return res.status(500).json(error);
  }

});

/**
 * Get /get_current_user
 * @summary Get information about the logged in user
 * @return {object} 200 - An array of user info
 * @return {Error}  default - Unexpected error
 */
app.get("/get_current_user", async function (req, res) {
  console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    res.status(400).json({ error: "access_token is required" });
    return;
  }
  let result = await axios.get(
    "https://secure.splitwise.com/api/v3.0/get_current_user",
    {
      headers: { Authorization: req.headers.authorization },
    }
  );
  const user = {};
  if (result.data?.user) {
    user.id = result.data.user.id;
    user.name =
      result.data.user.first_name +
      " " +
      (result.data.user.last_name
        ? result.data.user.last_name.slice(0, 1)
        : "");
  }
  res.status(200).json({ message: user });
});

/**
 * Get /get_friends
 * @summary Get information about the logged in user
 * @return {object} 200 - An array of user info
 * @return {Error}  default - Unexpected error
 * @param {string} access_token.query.required - access_token
 * 
 */
app.get("/get_friends", async function (req, res) {
  // console.log(req.headers.authorization);
  try {
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
    //sort ans based on name
    ans.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
    });
    res.send(ans);
  } catch (error) {
    return res.status(500).send(error);
  }

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

/**
 * Get /get_groups
 * @summary Get groups of the logged in user
 * @return {object} 200 - An array of groups
 * @return {Error}  default - Unexpected error
 * @param {string} access_token.query.required - access_token
 * 
 */


app.get("/get_groups", async function (req, res) {
  try {
    if (!req.headers.authorization) {
      res.status(400).send("access_token is required");
      return;
    }
    let result = await axios.get(
      "https://secure.splitwise.com/api/v3.0/get_groups",
      {
        headers: { Authorization: req.headers.authorization },
      }
    );
    const groups = [];

    if (result.data?.groups) {
      result.data.groups.map((group) => {
        groups.push({
          id: group.id,
          name: group.name,
          // group.members.
          members: group.members.map((member) => {
            return {
              id: member.id,
              name: member.first_name + " " + (member.last_name ? member.last_name.slice(0, 1) : ""),
            };
          }),
        });
      })
    }
    //sort ans based on name
    groups.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
    })
    res.send(groups);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// app.listen(3001);
// console.log("Server running on port %d", 3001);
module.exports.handler = serverless(app);
