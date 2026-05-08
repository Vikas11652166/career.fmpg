const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/job');
const Application = require('../models/application');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fmpg", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const jobs = await Job.find({});
  for (let job of jobs) {
      job.slug = undefined;
      await job.save();
      console.log(`Updated job ${job._id} with slug: ${job.slug}`);
  }

  const applications = await Application.find({});
  for (let application of applications) {
    application.slug = undefined;
    await application.save();
    console.log(`Updated application ${application._id} with slug: ${application.slug}`);
  }

  process.exit();
}
migrate();
