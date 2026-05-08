require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/careers_job_portal');
    const jobs = await Job.find({}).select('title slug _id');
    console.log(JSON.stringify(jobs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
