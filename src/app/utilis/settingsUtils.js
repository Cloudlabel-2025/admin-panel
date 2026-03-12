import mongoose from 'mongoose';
import { TIME_CONSTANTS } from './constants';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

/**
 * Get required login time from settings
 */
export const getRequiredLoginTime = async () => {
  try {
    const setting = await Settings.findOne({ key: 'REQUIRED_LOGIN_TIME' });
    return setting?.value || TIME_CONSTANTS.DEFAULT_REQUIRED_LOGIN_TIME;
  } catch (err) {
    console.error('Error fetching required login time:', err);
    return TIME_CONSTANTS.DEFAULT_REQUIRED_LOGIN_TIME;
  }
};

/**
 * Get setting by key
 */
export const getSetting = async (key) => {
  try {
    const setting = await Settings.findOne({ key });
    return setting?.value || null;
  } catch (err) {
    console.error(`Error fetching setting ${key}:`, err);
    return null;
  }
};

/**
 * Update setting
 */
export const updateSetting = async (key, value, updatedBy) => {
  try {
    return await Settings.findOneAndUpdate(
      { key },
      { key, value, updatedBy, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`Error updating setting ${key}:`, err);
    return null;
  }
};

export { Settings };
