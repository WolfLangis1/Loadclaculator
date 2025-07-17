
import { cors, authenticate } from '../utils/middleware.js';
import { authService } from '../services/authService.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (await authenticate(req, res)) return;

  const userId = req.userId;

  try {
    if (req.method === 'GET') {
      const userProfile = await authService.getUserProfile(userId);
      return res.status(200).json({ success: true, user: userProfile });
    } else if (req.method === 'PUT') {
      const { name, avatarUrl, metadata } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      if (metadata !== undefined) updates.metadata = metadata;

      const updatedUser = await authService.updateUserProfile(userId, updates);
      return res.status(200).json({ success: true, user: updatedUser });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
