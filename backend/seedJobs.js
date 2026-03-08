/**
 * Seeds jobs from data/jobs.json into MongoDB if the jobs collection is empty.
 * Called once on server startup.
 */
const Job = require('./models/Job');
const fs = require('fs');
const path = require('path');

async function seedJobs() {
  const count = await Job.countDocuments();
  if (count > 0) {
    console.log(`Jobs collection already has ${count} documents — skipping seed.`);
    return;
  }

  const filePath = path.join(__dirname, 'data', 'jobs.json');
  let jobs = [];
  try {
    jobs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.warn('Could not read jobs.json for seeding:', e.message);
    return;
  }

  const docs = jobs.map(j => ({
    jobId:           j.id,
    name:            j.name,
    requiredSkills:  j.requiredSkills || [],
    experienceRange: j.experienceRange || '',
    location:        j.location || '',
    roadmapSteps:    j.roadmapSteps || []
  }));

  await Job.insertMany(docs);
  console.log(`Seeded ${docs.length} jobs into MongoDB.`);
}

module.exports = seedJobs;
