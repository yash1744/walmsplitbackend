require("dotenv").config();

const Splitwise = require("splitwise");

const sw = Splitwise({
  consumerKey: process.env.SPLITWISE_CONSUMER_KEY,
  consumerSecret: process.env.SPLITWISE_CONSUMER_SECRET,
});

sw.getCurrentUser().then(console.log);
