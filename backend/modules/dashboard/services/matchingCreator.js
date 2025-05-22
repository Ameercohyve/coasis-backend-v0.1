const fs = require("fs");
const path = require("path");

// Load the pricing metrics from the JSON file
const pricingMetricsPath = path.join(
  __dirname,
  "..",
  "data",
  "pricing_metrics.json"
);
const pricingMetrics = JSON.parse(fs.readFileSync(pricingMetricsPath, "utf-8"));

/**
 * Find random creators matching a specified experience level and other filters
 * @param {Array} creators - Array of creator objects from MongoDB
 * @param {String} experienceLevel - Experience level to match
 * @param {Number} count - Number of random creators to return
 * @param {Object} filters - Additional filters: rejectedIds, service, subCategory, budget
 * @returns {Array} - Random creators matching the filters
 */
function findRandomCreators(
  creators,
  experienceLevel,
  count = 3,
  filters = {}
) {
  const { rejectedIds = [], service, serviceSubCategory, budget } = filters;

  // Get pricing details from pricing metrics based on service and subcategory
  const pricingData = pricingMetrics[service]?.[serviceSubCategory];

  let matchedCreatorTypes = [];

  if (pricingData?.creators) {
    matchedCreatorTypes = Object.entries(pricingData.creators)
      .filter(([creatorType, priceRange]) => {
        return budget >= priceRange.min && budget <= priceRange.max;
      })
      .map(([creatorType]) => creatorType); // Get only the creatorType names
  }

  // Check if pricing data is available for the given service-subcategory combination
  if (!pricingData) {
    return [];
  }

  const { creators: pricingCreators } = pricingData;

  // Filter creators based on all criteria
  const matchingCreators = creators.filter((creator) => {
    const availability = creator.availability || {};

    // Exclude rejected IDs
    if (rejectedIds.includes(String(creator._id))) return false;

    // Category check (NEW): Must match one of the creator types from pricing
    // if (!matchedCreatorTypes.includes(creator.category)) return false;

    if (
      !matchedCreatorTypes.includes(creator.category) ||
      (availability.pendingProjects ?? 0) >= 3 ||
      (availability.todoProjects ?? 0) >= 3 ||
      (availability.inProgressProjects ?? 0) >= 3
    )
      return false;

    return true;
  });

  // If nothing matches, return empty or fallback logic
  if (matchingCreators.length === 0) return [];

  // Shuffle and return limited count
  const shuffled = matchingCreators.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = { findRandomCreators };
