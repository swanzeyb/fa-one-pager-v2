# Firebase Configuration Guide

## Overview

This app uses Firebase AI Logic for client-side AI processing. Follow this guide to set up Firebase for development and production.

## Prerequisites

- Firebase project with AI Logic enabled
- Firebase CLI installed: `npm install -g firebase-tools`

## Development Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Firebase AI Logic:
   - Go to Project Settings → Integrations
   - Enable "Firebase AI Logic" (Vertex AI in Firebase)

### 2. Web App Configuration

1. In Firebase Console → Project Settings → Your apps
2. Add a web app or select existing
3. Copy the configuration object

### 3. App Check Setup

1. In Firebase Console → App Check
2. Register your web app
3. Select "reCAPTCHA v3" provider
4. Copy the site key

### 4. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase configuration values
3. Never commit `.env.local` to version control

## Production Deployment

### Vercel Deployment

1. In Vercel dashboard, go to your project settings
2. Add environment variables:
   - Copy all variables from `.env.local`
   - Paste into Vercel environment variables
   - Make sure to use production Firebase config

### Other Platforms

Set the same environment variables in your hosting platform:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY`

## Security Considerations

### App Check

- Always use App Check in production
- Keep reCAPTCHA site keys secure
- Monitor App Check usage in Firebase Console

### API Keys

- Firebase API keys are safe to expose in client-side code
- They identify your project but don't grant access
- Access is controlled by Firebase Security Rules and App Check

### Domain Security

- Configure authorized domains in Firebase Console
- Remove localhost from production authorized domains
- Add your production domain to authorized domains

## Monitoring

### Firebase Console

Monitor usage in Firebase Console:

- AI Logic usage and quotas
- App Check verification status
- Error logs and debugging

### Browser Console

In development, check browser console for:

- App Check initialization success
- Firebase AI Logic connection status
- Any error messages

## Troubleshooting

### Common Issues

**App Check Failed**

- Check reCAPTCHA site key is correct
- Verify domain is authorized
- Check Firebase Console for App Check status

**AI Logic Not Working**

- Ensure AI Logic is enabled in Firebase project
- Check quotas and billing in Firebase Console
- Verify App Check is working

**Environment Variables**

- All Firebase variables must start with `NEXT_PUBLIC_`
- Check for typos in variable names
- Restart development server after changing variables

**Domain Errors**

- Add your domain to Firebase authorized domains
- Check that domain matches exactly (with/without www)
- Verify SSL certificate is valid
