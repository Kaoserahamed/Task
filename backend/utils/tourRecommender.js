const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const rulesFilePath = path.join(__dirname, '../data/tour_association_rules.csv');

function loadRules(callback) {
  const rules = [];

  fs.createReadStream(rulesFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const antecedents = row.antecedents.split(',').map(dest => dest.trim());
      const consequents = row.consequents.split(',').map(dest => dest.trim());

      rules.push({
        antecedents,
        consequents,
        support: parseFloat(row.support),
        confidence: parseFloat(row.confidence),
        lift: parseFloat(row.lift)
      });
    })
    .on('end', () => {
      callback(rules);
    });
}

// Recommendation function
function recommendTours(selectedDestinations, callback) {
  loadRules((rules) => {
    const recommendations = new Set();

    rules.forEach(rule => {
      const isMatch = rule.antecedents.every(dest => selectedDestinations.includes(dest));
      if (isMatch) {
        rule.consequents.forEach(dest => {
          if (!selectedDestinations.includes(dest)) {
            recommendations.add(dest);
          }
        });
      }
    });

    callback(Array.from(recommendations));
  });
}

module.exports = {
  recommendTours
};
