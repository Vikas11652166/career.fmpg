const mongoose = require("mongoose");
const Job = require("../models/job");
const Application = require("../models/application");

/**
 * Find a job by either its ObjectId or its slug.
 * Returns a Mongoose document.
 * 
 * @param {string} identifier - ObjectId string or slug
 * @returns {Promise<Object|null>}
 */
const findJobByIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Job.findById(identifier);
    if (byId) return byId;
  }
  return Job.findOne({ slug: identifier });
};

/**
 * Find an application by either its ObjectId or its slug.
 * Allows population of fields.
 * Returns a Mongoose document.
 * 
 * @param {string} identifier - ObjectId string or slug
 * @param {Array} populate - Array of population objects/strings
 * @returns {Promise<Object|null>}
 */
const findApplicationByIdentifier = async (identifier, populate = null) => {
  if (!identifier) return null;
  let query;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = Application.findById(identifier);
  } else {
    query = Application.findOne({ slug: identifier });
  }

  if (populate) {
    populate.forEach((item) => {
      query = query.populate(item);
    });
  }

  return query;
};

module.exports = {
  findJobByIdentifier,
  findApplicationByIdentifier
};
