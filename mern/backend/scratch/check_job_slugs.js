const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Job = require('../models/job');
require('dotenv').config();

const checkJobs = async () => {
    try {
        await connectDB();
        const jobs = await Job.find({}, 'title slug');
        console.log('Jobs in DB:');
        jobs.forEach(job => {
            console.log(`- Title: ${job.title}, Slug: ${job.slug || 'MISSING'}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkJobs();
