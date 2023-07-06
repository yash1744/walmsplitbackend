const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            Unique: true,
        },
        accessToken: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Create the User model
const User = mongoose.model("User", userSchema);

// Export the User model
module.exports = User;
