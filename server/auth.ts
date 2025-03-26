import passport from 'passport';
import express, { NextFunction, Request, Response } from 'express';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import { storage } from './storage';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth credentials are not defined in environment variables');
}

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file']
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Check if user exists
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (!user) {
      // Create new user if not exists
      user = await storage.createUser({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value || 'unknown@example.com',
        profilePicture: profile.photos?.[0]?.value || undefined,
        accessToken,
        refreshToken
      });
    } else {
      // Update tokens if user exists
      user = await storage.updateUserTokens(user.id, accessToken, refreshToken);
    }
    
    return done(null, { 
      id: user.id, 
      googleId: user.googleId,
      role: user.role,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    return done(error as Error);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, (user as { id: number }).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (user) {
      // Ensure correct types for optional and nullable fields
      const userWithFixedTypes = {
        ...user,
        profilePicture: user.profilePicture || undefined,
        accessToken: user.accessToken ?? undefined,
        refreshToken: user.refreshToken ?? undefined,
        isAdmin: user.isAdmin ?? false,  // Ensure isAdmin is always a boolean
      };
      done(null, userWithFixedTypes);
    } else {
      done(null, null);
    }
  } catch (error) {
    done(error);
  }
});


// Configure Express session
export const configureAuth = (app: express.Express) => {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'letter-drive-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
};

// Auth routes
export const authRouter = express.Router();

// Google OAuth login route
authRouter.get('/google', passport.authenticate('google'));

// Google OAuth callback route
authRouter.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    successRedirect: '/'
  })
);

// Logout route
authRouter.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Current user route
authRouter.get('/current-user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  
  const user = req.user as User;
  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role,
      isAdmin: user.isAdmin
    }
  });
});

// Authentication middleware
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Admin role middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = req.user as User;
    if (user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Role-based access middleware
export const hasRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    const user = req.user as User;
    if (user.role === role || user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: `Forbidden: ${role} role required` });
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Types
export interface User {
  id: number;
  googleId: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  role: string;
  isAdmin: boolean;
  accessToken?: string;
  refreshToken?: string;
}

declare global {
  namespace Express {
    // Augment the User interface in Express namespace
    interface User {
      id: number;
      googleId: string;
      displayName: string;
      email: string;
      profilePicture?: string;
      role: string;
      isAdmin: boolean;
      accessToken?: string;
      refreshToken?: string;
    }
  }
}
