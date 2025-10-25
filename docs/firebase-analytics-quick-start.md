# Firebase Analytics - Quick Integration Guide

## 🚀 Quick Start

### 1. Get Your Measurement ID
```
Firebase Console → Project Settings → Your apps → Web app config
Look for: measurementId: "G-XXXXXXXXXX"
```

### 2. Update Environment Files
```typescript
// src/environments/environment.ts & environment.prod.ts
measurementId: "G-YOUR_ACTUAL_ID" // Replace placeholder
```

### 3. Inject Analytics Service
```typescript
import { AnalyticsService } from '../services/analytics.service';

export class YourComponent {
    private analytics = inject(AnalyticsService);
}
```

## 📝 Common Usage Patterns

### Track Page Views
```typescript
this.analytics.logTubeView(tubeId, tubeName);
```

### Track File Uploads
```typescript
this.analytics.logTubeUpload('.utd', 'triode');
```

### Track Calculations
```typescript
this.analytics.logParameterCalculation('norman-koren-triode', 'triode');
```

### Track Plot Generation
```typescript
this.analytics.logPlotGeneration('characteristic_curve', 'pentode');
```

### Track Save Operations
```typescript
this.analytics.logTubeSave(tubeId, isUpdate);
```

### Track Search/Filter
```typescript
this.analytics.logTubeSearch(searchTerm, resultsCount);
```

### Track Optimization
```typescript
// In worker message handler
this.analytics.logOptimization('powell', converged, iterations);
```

### Custom Events
```typescript
this.analytics.logEvent('custom_event', {
    param1: 'value1',
    param2: 'value2'
});
```

## 🔍 Testing

### Browser Console
```javascript
// Enable debug mode
window['ga-disable-G-YOUR_MEASUREMENT_ID'] = false;
```

### Firebase Console
```
Firebase Console → Analytics → DebugView
Events appear within minutes
```

## 📋 Integration Checklist

- [ ] Get Measurement ID from Firebase Console
- [ ] Update `src/environments/environment.ts`
- [ ] Update `src/environments/environment.prod.ts`
- [ ] Verify Analytics enabled in Firebase Console
- [ ] Add `logTubeView()` in TubeComponent
- [ ] Add `logTubeUpload()` in TubeComponent
- [ ] Add `logPlotGeneration()` in TubePlotComponent
- [ ] Add `logParameterCalculation()` in parameter components
- [ ] Add `logTubeSearch()` in TubesComponent
- [ ] Add `logTubeSave()` in FirebaseTubeService
- [ ] Test in DebugView
- [ ] Verify events in Analytics Dashboard (24h delay)

## ⚡ Already Integrated

✅ Authentication tracking (login/signup)
✅ User ID tracking
✅ Service infrastructure
✅ Error handling

## 📚 Full Documentation

See `docs/firebase-analytics-integration.md` for complete details.

## 🆘 Help

**Events not appearing?**
1. Check browser console for errors
2. Verify measurementId in environment files
3. Enable Analytics in Firebase Console
4. Use DebugView for real-time verification

**Build errors?**
```bash
npm install
npm run build
```
