require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

const slugBase = (value) => {
  return (value || 'job')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'job';
};

const alphaSuffix = (index) => {
  if (index <= 0) return '';
  let n = index;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
};

const ensureUniqueSlug = async (model, base, selfId) => {
  let attempt = 0;
  while (true) {
    const suffix = alphaSuffix(attempt);
    const candidate = suffix ? `${base}-${suffix}` : base;
    const conflict = await model.findOne({
      slug: candidate,
      _id: { $ne: selfId }
    }).select('_id');
    if (!conflict) return candidate;
    attempt += 1;
  }
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/careers_job_portal');
    console.log('Connected to DB');

    const jobs = await Job.find({ slug: { $exists: false } });
    console.log(`Found ${jobs.length} jobs without slugs`);

    for (const job of jobs) {
      const base = slugBase(job.title || job.position);
      job.slug = await ensureUniqueSlug(Job, base, job._id);
      await job.save();
      console.log(`Generated slug for ${job.title}: ${job.slug}`);
    }

    // Also update existing slugs that might be null
    const nullSlugs = await Job.find({ slug: null });
    console.log(`Found ${nullSlugs.length} jobs with null slugs`);
    for (const job of nullSlugs) {
        const base = slugBase(job.title || job.position);
        job.slug = await ensureUniqueSlug(Job, base, job._id);
        await job.save();
        console.log(`Generated slug for ${job.title}: ${job.slug}`);
      }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
