import SoilTest from '../models/SoilTest.js';

export const submitTest = async (req, res) => {
  try {
    const testResult = await SoilTest.create({ farmerId: req.user.id, ...req.body });
    res.status(201).json({ success: true, data: testResult });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};

export const getRegionalMap = async (req, res) => {
  try {
    const tests = await SoilTest.find({ location: { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)] }, $maxDistance: 50000 } } });
    res.status(200).json({ count: tests.length, data: tests });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};