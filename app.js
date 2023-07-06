// import Passage from "@passageidentity/passage-node";
require("dotenv").config();
const mongoose = require("mongoose");

mongoose
    .connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

const User = require("./models/user");
const Friends = require("./models/friends");
const Groups = require("./models/groups");

var express = require("express");
var cors = require("cors");
var app = express();
var cookieParser = require("cookie-parser");
var axios = require("axios");
const jwt = require("jsonwebtoken");
const { encryptData, decryptData } = require("./crypt");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

const validateAccessToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(400).send("access_token is required");
    }
    next();
};

/**
 * Get /
 * @summary This is the summary of the endpoint
 * @return {object} 200 - An array of user info
 * @return {Error}  default - Unexpected error
 */
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
app.get("/", async function (req, res) {
    try {
        console.log("done");
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
app.get("/get_current_user", validateAccessToken, async function (req, res) {
    let result;
    try {
        result = await axios.get(
            "https://secure.splitwise.com/api/v3.0/get_current_user",
            {
                headers: { Authorization: req.headers.authorization },
            }
        );
    } catch (error) {
        return res
            .status(401)
            .json({ error: "unauthorized: access token is invalid" });
    }

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
    return res.status(200).json(user);
});

/**
 * Get /get_friends
 * @summary Get information about the logged in user
 * @return {object} 200 - An array of user info
 * @return {Error}  default - Unexpected error
 * @param {string} access_token.query.required - access_token
 *
 */
app.get("/get_friends", validateAccessToken, async function (req, res) {
    // console.log(req.headers.authorization);
    try {
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
                        (friend.last_name ? friend.last_name : ""),
                    // (friend.last_name ? friend.last_name.slice(0, 1) : ""),
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
    //console.log(req.body);
    if (!req.body.expense) {
        return res.status(200).json({ error: "expense is required" });
    }
    console.log(req.body.expense);
    // return res.json({ message: "done" });
    try {
        let result = await axios.get(
            "https://secure.splitwise.com/api/v3.0/create_expense",
            {
                headers: { Authorization: req.headers.authorization },
                params: req.body.expense,
            }
        );
        console.log(result.data);
        if (Object.keys(result.data?.errors).length) {
            return res.status(200).json({ error: result.data.errors.base });
        }
        return res.send(result.data);
    } catch (error) {
        console.log(error);
        return res.status(200).send(error);
    }
});

/**
 * Get /get_groups
 * @summary Get groups of the logged in user
 * @return {object} 200 - An array of groups
 * @return {Error}  default - Unexpected error
 * @param {string} access_token.query.required - access_token
 *
 */

app.get("/get_groups", validateAccessToken, async function (req, res) {
    let result;
    try {
        try {
            result = await axios.get(
                "https://secure.splitwise.com/api/v3.0/get_groups",
                {
                    headers: { Authorization: req.headers.authorization },
                }
            );
        } catch (error) {
            return res
                .status(401)
                .json({ error: "unauthorized: access token is invalid" });
        }

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
                            name:
                                member.first_name +
                                " " +
                                (member.last_name
                                    ? member.last_name.slice(0, 1)
                                    : ""),
                        };
                    }),
                });
            });
        }
        //sort ans based on name
        groups.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
        });
        res.send(groups);
    } catch (error) {
        return res.status(500).send(error);
    }
});

app.listen(3001);
console.log("Server running on port %d", 3001);

module.exports = app;

const generateJwtToken = (user) => {
    const payload = {
        id: user.id,
        name: user.name,
    };
    const encryptedPayload = {
        payloadData: encryptData(JSON.stringify(payload)),
    };

    return jwt.sign(encryptedPayload, process.env.JWT_SECRET);
};

app.post("/v2/login", async (req, res) => {
    try {
        const code = req.body.authorizationcode;
        if (code == null) {
            return res
                .status(400)
                .json({ error: "authorization code is required" });
        }
        // console.log(code);
        // console.log({
        //     client_id: process.env.SPLITWISE_CONSUMER_KEY,
        //     client_secret: process.env.SPLITWISE_CONSUMER_SECRET,
        //     redirect_uri: process.env.SPLITWISE_REDIRECT_URI,
        //     grant_type: "authorization_code",
        //     code: code,
        // });
        const tokenresponse = await axios.post(
            "https://secure.splitwise.com/oauth/token",
            {
                client_id: process.env.SPLITWISE_CONSUMER_KEY,
                client_secret: process.env.SPLITWISE_CONSUMER_SECRET,
                redirect_uri: process.env.SPLITWISE_REDIRECT_URI,
                grant_type: "authorization_code",
                code: code,
            }
        );

        const splitwisebearer = "Bearer " + tokenresponse.data?.access_token;
        const userresponse = await axios.get(
            "https://secure.splitwise.com/api/v3.0/get_current_user",
            {
                headers: { Authorization: splitwisebearer },
            }
        );

        const user = userresponse.data?.user;
        if (user) {
            await User.findOneAndUpdate(
                { userId: user.id }, // Search condition
                { $set: { accessToken: splitwisebearer } }, // Update fields
                { upsert: true, new: true } // Options: upsert - create if not found, new - return the updated document
            );

            return res.status(200).json({ token: generateJwtToken(user) });
        } else {
            throw new Error("unauthorized: access token is invalid");
        }
    } catch (error) {
        return res
            .status(401)
            .json({ error: "unauthorized: access token is invalid" });
    }
});

const expiryTime = 60 * 60 * 24 * 3;
app.get("/v2/verify", async (req, res) => {
    try {
        const { token } = req.headers;
        if (!token) {
            return res
                .status(401)
                .json({ error: "No token, authorization denied" });
        }

        const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decryptedToken.iat + expiryTime < Math.floor(Date.now() / 1000)) {
            throw new Error("Token expired");
        }
        const decoded = decryptData(decryptedToken.payloadData);
        return res.status(200).json({ user: JSON.parse(decoded) });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: "Token is not valid" });
    }
});

app.use((req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res
            .status(401)
            .json({ error: "No token, authorization denied" });
    }
    next();
});

app.use(async (req, res, next) => {
    const { token } = req.headers;
    try {
        const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (decryptedToken.iat + expiryTime < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({ error: "Token expired" });
        }
        const decoded = decryptData(decryptedToken.payloadData);
        req.user = JSON.parse(decoded);
        const user = await User.findOne({ userId: req.user.id });

        console.log(decryptedToken.iat);
        if (decryptedToken.iat < Math.floor(user.updatedAt.getTime() / 1000)) {
            return res.status(401).json({ error: "Token expired" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid Token" });
    }
});

app.get("/v2/get_current_user", async function (req, res) {
    try {
        const token = (await User.findOne({ userId: req.user.id })).accessToken;
        const userresponse = await axios.get(
            "https://secure.splitwise.com/api/v3.0/get_current_user",
            {
                headers: { Authorization: token },
            }
        );
        const user = userresponse.data?.user;
        if (user) {
            return res.status(200).json(user);
        } else {
            return res.status(401).json({ error: "Invalid Token" });
        }
    } catch (error) {
        return res.status(401).json({ error: "Invalid Token" });
    }
});

const fetchFriendsSplitWise = async (accessToken) => {
    let result = await axios.get(
        "https://secure.splitwise.com/api/v3.0/get_friends",
        {
            headers: { Authorization: accessToken },
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
                    (friend.last_name ? friend.last_name : ""),
                // (friend.last_name ? friend.last_name.slice(0, 1) : ""),

                image: friend.picture?.large,
            });
        });
    }
    ans.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
    });
    return ans;
};

const fetchGroupsSplitWise = async (accessToken) => {
    let result;

    try {
        result = await axios.get(
            "https://secure.splitwise.com/api/v3.0/get_groups",
            {
                headers: { Authorization: accessToken },
            }
        );
    } catch (error) {
        return res
            .status(401)
            .json({ error: "unauthorized: access token is invalid" });
    }

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
                        name:
                            member.first_name +
                            " " +
                            (member.last_name
                                ? member.last_name.slice(0, 1)
                                : ""),
                    };
                }),
            });
        });
    }
    //sort ans based on name
    groups.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
    });
    return groups;
};
app.get("/v2/get_friends", async function (req, res) {
    const user = req.user;
    const force = req.body.force;
    try {
        if (!force) {
            const userfriends = await Friends.findOne({ id: user.id });
            if (userfriends) {
                return res.status(200).json(userfriends.friends);
            }
        }

        const token = (await User.findOne({ userId: user.id })).accessToken;
        const splitwisefriends = await fetchFriendsSplitWise(token);
        console.log(splitwisefriends);

        const newuserfriends = await Friends.findOneAndUpdate(
            { id: user.id }, // Search condition
            { $set: { friends: splitwisefriends } }, // Update fields
            { upsert: true, new: true } // Options: upsert - create if not found, new - return the updated document
        );

        return res.status(200).json(newuserfriends.friends);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
app.get("/v2/get_groups", async function (req, res) {
    const user = req.user;
    const force = req.body.force;
    try {
        const usergroups = await Groups.findOne({ id: user.id });
        if (!force) {
            if (usergroups) {
                return res.status(200).json(usergroups.groups);
            }
        }
        const token = (await User.findOne({ userId: user.id })).accessToken;
        const splitwisegroups = await fetchGroupsSplitWise(token);
        const newusergroups = await Groups.findOneAndUpdate(
            { id: user.id }, // Search condition
            { $set: { groups: splitwisegroups } }, // Update fields
            { upsert: true, new: true } // Options: upsert - create if not found, new - return the updated document
        );
        return res.status(200).json(newusergroups.groups);
    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
app.post("/v2/create_expense", async function (req, res) {
    const user = req.user;
    const token = (await User.findOne({ userId: user.id })).accessToken;
    console.log(req);
    console.log(req.data);
    if (!req.body.expense) {
        return res.status(400).json({ error: "expense is required" });
    }
    try {
        let result = await axios.get(
            "https://secure.splitwise.com/api/v3.0/create_expense",
            {
                headers: { Authorization: token },
                params: req.body.expense,
            }
        );
        console.log(result.data);
        if (Object.keys(result.data?.errors).length) {
            return res.status(400).json({ error: result.data.errors.base });
        }
        return res.send(result.data);
    } catch (error) {
        return res.status(400).send(error);
    }
});
