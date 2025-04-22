const pool = require('../db');
const { calculateDistance } = require('../utils/distance');


exports.addSchool = async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validate input fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a valid string.' });
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return res.status(400).json({ error: 'Address is required and must be a valid string.' });
  }

  if (isNaN(latitude) || latitude <= -90 || latitude >= 90) {
    return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
  }

  if (isNaN(longitude) || longitude <= -180 || longitude >= 180) {
    return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
  }

  try {
    const conn = await pool.getConnection();
    await conn.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );
    conn.release();
    res.status(201).json({ message: 'School added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.listSchools = async (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  // Validate latitude and longitude from the query string
  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: 'Both latitude and longitude must be valid numbers.' });
  }

  if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180) {
    return res.status(400).json({ error: 'Latitude must be between -90 and 90, and longitude must be between -180 and 180.' });
  }

  try {
    const conn = await pool.getConnection();
    const [schools] = await conn.execute('SELECT * FROM schools');
    conn.release();

    const schoolsWithDistance = schools.map((school) => ({
      ...school,
      distance: calculateDistance(userLat, userLon, school.latitude, school.longitude),
    }));

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};
