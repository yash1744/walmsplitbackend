const mongoose = require("mongoose");

// Define the user schema
const friendsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    friends: [],
});

// Create the user model
const Friend = mongoose.model("Friend", friendsSchema);

// Export the model
module.exports = Friend;
