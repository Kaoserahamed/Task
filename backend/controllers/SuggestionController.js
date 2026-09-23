const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Make sure to install with: npm i csv-parser
const Tours = require('../models/tours');
const rulesPath = path.join(__dirname, '../data/tour_association_rules.csv');

// Helper function to check if a tour is upcoming
const isTourUpcoming = (startDate) => {
  if (!startDate) return false;
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  oneDayFromNow.setHours(0, 0, 0, 0); // Start of day

  const tourStartDate = new Date(startDate);
  return tourStartDate >= oneDayFromNow;
};

exports.getSuggestions = async (req, res) => {
  const { tourName } = req.params;
  const suggestions = [];
  console.log('Searching for suggestions for:', tourName);

  try {
    // First get all tours to search through
    const allTours = await Tours.find({});
    console.log('Found', allTours.length, 'tours to search through');

    fs.createReadStream(rulesPath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Check if the tourName is in antecedents
          if (row.antecedents === tourName) {
            // Find tours where weather.city matches the consequent and is upcoming
            const matchingTours = allTours.filter(
              (tour) =>
                tour.weather &&
                tour.weather.city &&
                tour.weather.city.toLowerCase() === row.consequents.toLowerCase() &&
                tour.status === 'approved' &&
                isTourUpcoming(tour.startDate)
            );

            if (matchingTours.length > 0) {
              suggestions.push({
                destination: row.consequents,
                confidence: parseFloat(row.confidence),
                tours: matchingTours,
              });
            }
          }
        } catch (err) {
          console.error('Parse error:', err);
        }
      })
      .on('end', async () => {
        try {
          // Sort suggestions by confidence in descending order
          suggestions.sort((a, b) => b.confidence - a.confidence);

          // Extract just the destinations and their tours in order
          const sortedSuggestions = suggestions.map((s) => ({
            destination: s.destination,
            confidence: s.confidence,
            tours: s.tours,
          }));

          console.log('Found', sortedSuggestions.length, 'suggestions with upcoming tours');
          res.json(sortedSuggestions);
        } catch (err) {
          console.error('Error processing suggestions:', err);
          res.status(500).json({ error: 'Error processing suggestions' });
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        res.status(500).json({ error: 'Error reading suggestions' });
      });
  } catch (err) {
    console.error('Error fetching tours:', err);
    res.status(500).json({ error: 'Error fetching tours' });
  }
};
