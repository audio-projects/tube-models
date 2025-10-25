# Firebase Analytics Integration

This document describes the Firebase Analytics integration in the TubeModels application.

## Overview

Firebase Analytics is integrated into the TubeModels application to track user behavior, app usage, and engagement metrics. The integration follows the official Firebase documentation for web applications.

## Setup

### 1. Firebase Console Configuration

Before the analytics can work, you need to enable Google Analytics in your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `audio-projects-9ccc3`
3. Navigate to **Project Settings** (gear icon) → **Integrations** tab
4. Enable **Google Analytics** if not already enabled
5. Find your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Update Environment Configuration

Replace the placeholder `measurementId` in both environment files with your actual Measurement ID:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

```typescript
firebase: {
    // ... other config
    measurementId: "G-YOUR_ACTUAL_MEASUREMENT_ID" // Replace this
}
```

### 3. Dependencies

Firebase Analytics is included in the `@angular/fire` package (v17.1.0) which is already installed. No additional npm packages are required.

## Architecture

### AnalyticsService

The `AnalyticsService` (`src/app/services/analytics.service.ts`) is the central service for all analytics operations. It provides:

- **Type-safe event logging methods** for common application events
- **Error handling** to prevent analytics errors from affecting app functionality
- **User identification** and property management
- **Custom event logging** for flexible tracking

### App Configuration

Analytics is initialized in `app.config.ts` using Angular Fire providers:

```typescript
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';

providers: [
    // ... other providers
    provideAnalytics(() => getAnalytics())
]
```

## Usage

### Injecting the Service

```typescript
import { AnalyticsService } from './services/analytics.service';

export class MyComponent {
    private analyticsService = inject(AnalyticsService);
}
```

### Tracking Common Events

#### Tube Viewing
```typescript
this.analyticsService.logTubeView(tubeId, tubeName);
```

#### Tube Upload
```typescript
this.analyticsService.logTubeUpload('.utd', 'triode');
```

#### Parameter Calculation
```typescript
this.analyticsService.logParameterCalculation('norman-koren-triode', 'triode');
```

#### Plot Generation
```typescript
this.analyticsService.logPlotGeneration('characteristic_curve', 'pentode');
```

#### Tube Save
```typescript
this.analyticsService.logTubeSave(tubeId, isUpdate);
```

#### Tube Sharing
```typescript
this.analyticsService.logTubeShare(tubeId);
```

#### Search Activity
```typescript
this.analyticsService.logTubeSearch(searchTerm, resultsCount);
```

#### Optimization Completion
```typescript
this.analyticsService.logOptimization('powell', true, 100);
```

#### Authentication
```typescript
this.analyticsService.logLogin('google');
this.analyticsService.logSignUp('google');
```

### Custom Events

For events not covered by the predefined methods:

```typescript
this.analyticsService.logEvent('custom_event_name', {
    param1: 'value1',
    param2: 'value2'
});
```

### User Identification

Set the user ID after authentication:

```typescript
this.analyticsService.setUserId(user.uid);
```

Set user properties for segmentation:

```typescript
this.analyticsService.setUserProperties({
    userType: 'premium',
    preferredTubeType: 'triode'
});
```

## Integration Points

### Recommended Integration Locations

1. **TubeComponent** (`src/app/components/tube.component.ts`)
   - Log `tube_view` when a tube is loaded
   - Log `tube_save` when saving to Firebase
   - Log `tube_upload` when file is uploaded

2. **TubePlotComponent** (`src/app/components/tube-plot.component.ts`)
   - Log `plot_generation` when plots are rendered

3. **NormanKoren*ModelParametersComponent**
   - Log `parameter_calculation` when optimization starts
   - Log `optimization_complete` when worker completes

4. **TubesComponent** (`src/app/components/tubes.component.ts`)
   - Log `tube_search` when filtering/searching tubes

5. **AuthService** (`src/app/services/auth.service.ts`)
   - Log `login` when user authenticates
   - Call `setUserId()` after successful login

6. **FirebaseTubeService** (`src/app/services/firebase-tube.service.ts`)
   - Log `tube_share` when tubes are shared

## Event Structure

All custom events follow Firebase Analytics best practices:

- **Event names**: lowercase with underscores (e.g., `tube_view`, `parameter_calculation`)
- **Parameter names**: lowercase with underscores
- **Limited parameters**: Keep parameter count reasonable (5-10 per event)
- **Value types**: strings, numbers, booleans (avoid complex objects)

## Automatically Tracked Events

Firebase Analytics automatically tracks these events without additional code:

- `page_view` - Page navigation
- `first_visit` - User's first visit
- `session_start` - Beginning of user session
- `user_engagement` - User engagement metrics

## Debugging

### Enable Debug Mode

To test analytics events during development:

1. Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) Chrome extension
2. Enable the extension
3. Open Chrome DevTools Console
4. Events will be logged in the console

Alternatively, add this to your browser console:
```javascript
window['ga-disable-G-YOUR_MEASUREMENT_ID'] = false;
```

### Firebase Console

View analytics data in real-time:

1. Go to Firebase Console → Analytics → DebugView
2. Events appear within minutes in debug mode
3. Standard events appear in reports within 24 hours

## Privacy and Compliance

### Data Collection

The analytics implementation collects:
- User interactions (events)
- Page views
- User properties (when explicitly set)
- Tube IDs and names (non-personal)
- Model types and algorithms used

### User Privacy

- No personally identifiable information (PII) is collected in custom events
- User IDs are Firebase Auth UIDs (anonymized)
- IP anonymization is enabled by default in Firebase Analytics

### GDPR/Privacy Compliance

Consider adding:
1. Cookie consent banner if required by your jurisdiction
2. Privacy policy explaining analytics data collection
3. Opt-out mechanism for users who don't want to be tracked

Example opt-out:
```typescript
// Disable analytics for this user
import { setAnalyticsCollectionEnabled } from '@angular/fire/analytics';

setAnalyticsCollectionEnabled(this.analytics, false);
```

## Testing

Unit tests for the AnalyticsService are in `analytics.service.spec.ts`. Run tests with:

```bash
npm test
```

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Firebase Web Get Started](https://firebase.google.com/docs/analytics/get-started?platform=web)
- [Angular Fire Analytics Guide](https://github.com/angular/angularfire/blob/master/docs/analytics/getting-started.md)
- [Google Analytics Events Reference](https://support.google.com/analytics/answer/9267735)

## Troubleshooting

### Events Not Appearing

1. **Check measurementId**: Ensure it's correctly set in environment files
2. **Verify Firebase Console**: Confirm Analytics is enabled
3. **Check browser console**: Look for Analytics initialization errors
4. **Use DebugView**: Enable debug mode to see real-time events
5. **Wait for data**: Standard events can take up to 24 hours to appear

### Build Errors

If you see TypeScript errors about Analytics types:
```bash
npm install --save-dev @angular/fire
```

### Missing measurementId

Error: `Analytics: missing required field 'measurementId'`

**Solution**: Add the `measurementId` field to your Firebase config in environment files.

## Future Enhancements

Potential improvements:

1. **E-commerce tracking**: Track tube "purchases" or premium features
2. **User segmentation**: Create audiences based on tube preferences
3. **A/B testing**: Use Firebase Remote Config with Analytics audiences
4. **Funnel analysis**: Track user journey from upload → optimization → save
5. **Performance monitoring**: Integrate Firebase Performance Monitoring
6. **Error tracking**: Link Analytics with Crashlytics for web errors
