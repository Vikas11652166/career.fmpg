const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/database");
const User = require("../models/user");
const { ROLES, STATUS } = require("../utils/constants");

const fixStaffStatus = async () => {
  try {
    await connectDB();
    console.log("Database connected. Starting migration...");

    const staffRoles = [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.SUPER_ADMIN];
    
    // Find all staff members who don't have a status or have an empty/invalid status
    const staffToUpdate = await User.find({
      role: { $in: staffRoles },
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: "" },
        { status: { $nin: Object.values(STATUS) } }
      ]
    });

    console.log(`Found ${staffToUpdate.length} staff members with missing or invalid status.`);

    if (staffToUpdate.length === 0) {
      console.log("No staff members need updating.");
      process.exit(0);
    }

    let updatedCount = 0;
    for (const user of staffToUpdate) {
      user.status = STATUS.ACTIVE;
      await user.save();
      updatedCount++;
      console.log(`Updated ${user.email} status to ${STATUS.ACTIVE} (${updatedCount}/${staffToUpdate.length})`);
    }

    console.log(`Successfully updated ${updatedCount} staff members.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

fixStaffStatus();
