import mongoose from 'mongoose';
import Crop from './models/Crop.js';

mongoose.connect('mongodb://127.0.0.1:27017/rythusethu').then(async () => {
  await Crop.updateOne({ name: /spinach/i }, { $set: { latitude: 18.7909, longitude: 78.9102 } });
  console.log('Fixed Spinach');
  process.exit(0);
});
