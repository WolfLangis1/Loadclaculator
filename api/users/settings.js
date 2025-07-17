
import { cors, authenticate } from '../utils/middleware.js';
import { userService } from '../services/userService.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (await authenticate(req, res)) return;

  const userId = req.userId;

  try {
    if (req.method === 'GET') {
      const settings = await userService.getUserSettings(userId);
      return res.status(200).json({ success: true, settings });
    } else if (req.method === 'PUT') {
      const {
        theme,
        defaultVoltage,
        defaultPhase,
        units,
        autoSave,
        emailNotifications,
        companyName,
        companyLogoUrl,
        licenseNumber,
        defaultJurisdiction,
        customSettings
      } = req.body;

      const updates = {};
      if (theme !== undefined) updates.theme = theme;
      if (defaultVoltage !== undefined) updates.default_voltage = defaultVoltage;
      if (defaultPhase !== undefined) updates.default_phase = defaultPhase;
      if (units !== undefined) updates.units = units;
      if (autoSave !== undefined) updates.auto_save = autoSave;
      if (emailNotifications !== undefined) updates.email_notifications = emailNotifications;
      if (companyName !== undefined) updates.company_name = companyName;
      if (companyLogoUrl !== undefined) updates.company_logo_url = companyLogoUrl;
      if (licenseNumber !== undefined) updates.license_number = licenseNumber;
      if (defaultJurisdiction !== undefined) updates.default_jurisdiction = defaultJurisdiction;
      if (customSettings !== undefined) updates.custom_settings = customSettings;

      const updatedSettings = await userService.updateUserSettings(userId, updates);

      return res.status(200).json({
        success: true,
        settings: updatedSettings
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
