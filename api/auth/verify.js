
import { cors, rateLimit } from '../utils/middleware.js';
import { authService } from '../services/authService.js';
import apiKeyManager from '../utils/apiKeyManager.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (rateLimit(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const decodedToken = await authService.verifyIdToken(idToken);
    const { uid, email, name, picture, firebase } = decodedToken;

    const isGuest = firebase.sign_in_provider === 'anonymous';

    const userData = await authService.getOrCreateUser(
      uid,
      email,
      name,
      firebase.sign_in_provider === 'google.com' ? firebase.identities?.['google.com']?.[0] : null,
      picture,
      isGuest
    );

    // Use secure JWT secret from apiKeyManager
    const jwtSecret = apiKeyManager.getJwtSecret();
    
    const appToken = jwt.sign(
      {
        userId: userData.id,
        firebaseUid: uid,
        email: userData.email,
        isGuest: userData.is_guest,
        subscriptionTier: userData.subscription_tier,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const userProfile = await authService.getUserProfile(userData.id);

    return res.status(200).json({
      success: true,
      token: appToken,
      user: userProfile,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}
