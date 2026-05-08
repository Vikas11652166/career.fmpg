const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const { ROLES, EMPLOYEE_STATUS, DEPARTMENTS } = require('../utils/constants');

const migrate = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fmpg");
        console.log('Connected successfully.');

        const users = await User.find({});
        console.log(`Found ${users.length} users to process.`);

        let updatedCount = 0;

        for (const user of users) {
            let needsUpdate = false;
            const updateData = {};

            // 1. Super Admin Migration (Legacy check)
            if (user.role === 'admin' && user.specialAuthority === true) {
                updateData.role = ROLES.SUPER_ADMIN;
                updateData.$unset = { specialAuthority: 1 }; // Explicitly remove the field
                needsUpdate = true;
                console.log(`Migrating ${user.email} to super-admin and removing specialAuthority`);
            }

            // 2. HR Role to Department Migration
            if (user.role === 'hr') {
                updateData.role = ROLES.EMPLOYEE;
                updateData.department = DEPARTMENTS.HR;
                updateData.permissions = {
                    ...user.permissions,
                    canViewApplicants: true,
                    canCreateJob: true,
                    canManageReviews: true,
                    canAccessDashboard: true
                };
                needsUpdate = true;
                console.log(`Migrating HR user ${user.email} to employee role + HR department with permissions`);
            }

            // 3. User+Employee Status to Employee Role Migration
            if (user.role === 'user' && user.employeeStatus === 'employee') {
                updateData.role = ROLES.EMPLOYEE;
                updateData.employeeStatus = EMPLOYEE_STATUS.ACTIVE;
                needsUpdate = true;
                console.log(`Migrating employee user ${user.email} to employee role`);
            }

            // 4. Status Enum Normalization
            if (user.employeeStatus === 'employee') {
                updateData.employeeStatus = EMPLOYEE_STATUS.ACTIVE;
                needsUpdate = true;
            } else if (user.employeeStatus === 'former_employee') {
                updateData.employeeStatus = EMPLOYEE_STATUS.FORMER;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await User.findByIdAndUpdate(user._id, updateData);
                updatedCount++;
            }
        }

        console.log(`Migration completed. ${updatedCount} users updated.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
