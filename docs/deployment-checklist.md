# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables set in hosting platform
- [ ] Firebase project configured for production
- [ ] App Check enabled with production reCAPTCHA key
- [ ] Production domain added to Firebase authorized domains
- [ ] All tests passing (`npm run build` succeeds)
- [ ] No console errors in development

## Firebase Configuration

- [ ] AI Logic enabled in Firebase project
- [ ] App Check configured with reCAPTCHA v3
- [ ] Billing set up for AI Logic usage
- [ ] Quotas configured appropriately
- [ ] Authorized domains include production domain

## Environment Variables

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` set
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY` set (production reCAPTCHA key)

## Post-Deployment Testing

- [ ] App loads without errors
- [ ] Firebase AI Logic processes files correctly
- [ ] Document generation (DOCX/PDF) works
- [ ] App Check verifies successfully
- [ ] No console errors in production
- [ ] AI processing completes successfully

## Monitoring

- [ ] Set up Firebase usage monitoring
- [ ] Configure billing alerts
- [ ] Monitor App Check verification rates
- [ ] Check AI Logic quota usage
