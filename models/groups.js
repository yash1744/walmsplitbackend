const mongoose = require("mongoose");

// Define the user schema
const groupsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    groups: [],
});

// Create the user model
const Group = mongoose.model("Group", groupsSchema);

// Export the model
module.exports = Group;
