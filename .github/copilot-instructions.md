# TubeModels AI Coding Agent Instructions

## Project Overview

TubeModels is an Angular 19 application for vacuum tube (electron tube) modeling and characteristic analysis. It implements mathematical models (primarily Norman-Koren triode model) to analyze and visualize tube behavior from measurement data.

## Core Architecture

### Domain Model

- **TubeInformation** (`src/app/components/tube-information.ts`): Central data structure representing vacuum tubes with electrical specifications, measurement files, and calculated SPICE parameters
- **File/Series/Point** (`src/app/files.ts`): Measurement data structure where Files contain Series (constant voltages) containing Points (individual measurements)
- Tube types: Triode, Pentode, Tetrode with different electrical characteristics

### Key Components

- **TubeComponent** (`src/app/components/tube.component.ts`): Main tube editor with tabbed interface (upload, plot, specifications, SPICE parameters)
- **TubesComponent** (`src/app/components/tubes.component.ts`): List view with Firebase integration for browsing shared tubes  
- **TubePlotComponent** (`src/app/components/tube-plot.component.ts`): Chart.js visualization with model overlay capability
- **NormanKorenPentodeModelParametersComponent/NormanKorenTriodeModelParametersComponent**: SPICE parameter calculation UI components

### Services Architecture

- **TubeDataService**: Local storage and reactive state management using BehaviorSubject
- **FirebaseTubeService**: Cloud persistence with ownership-based access control
- **AuthService**: Google OAuth integration for tube ownership
- **FileParserService**: Automatic measurement type detection and .utd file parsing

## Mathematical Computing

### Web Worker Architecture

All parameter optimization runs in dedicated worker files to prevent UI blocking:

- **optimize-norman-koren-triode-model-parameters.worker.ts**: Triode model optimization
- **optimize-norman-koren-pentode-model-parameters.worker.ts**: Pentode model optimization  
- **optimize-norman-koren-new-pentode-model-parameters.worker.ts**: New pentode model variant

### Optimization Algorithms

- **Powell algorithm** (`src/app/workers/algorithms/powell.ts`): Derivative-free optimization
- **Levenberg-Marquardt** (`src/app/workers/algorithms/Levenberg-Marquardt.ts`): Non-linear least squares
- **Custom algorithms**: Gaussian elimination, Newton-Simple-Dogleg for numerical optimization
- **Total Harmonic Distortion** (`src/app/workers/algorithms/total-harmonic-distortion.ts`): THD calculation for audio analysis

### Tube Models

- **Norman-Koren Triode Model** (`src/app/workers/models/norman-koren-triode-model.ts`): Core triode model using parameters (mu, ex, kg1, kp, kvb)
- **Norman-Koren Pentode Models** (`src/app/workers/models/`): Multiple pentode model implementations
- **Derk Models** (`src/app/workers/models/derk-*.ts`): Alternative tube modeling approaches
- **IPK Model** (`src/app/workers/models/ipk.ts`): Additional tube modeling implementation

### Mathematical Libraries

- **mathjs**: Vector operations and mathematical functions in `src/app/workers/algorithms/vector.ts`
- **fraction.js**: Precise fractional arithmetic for calculations

## Data Import Workflow

### .utd File Format

Tab-delimited files with columns: `Point`, `Curve`, `Ia (mA)`, `Vg (V)`, `Va (V)`, `Vs (V)`, `Is (mA)`, `Vf (V)`

- **Point**: Measurement sequence number
- **Curve**: Series identifier (constant grid voltage curves)
- **Ia**: Plate current, **Is**: Screen current, **Vg**: Grid voltage, **Va**: Plate voltage, **Vs**: Screen voltage, **Vf**: Heater voltage

### Measurement Type Detection

FileParserService automatically detects measurement types like:

- `IP_VG_VA_VH`: Plate current vs grid/plate voltage with constant heater
- `IP_VA_VG_VH`: Plate current vs plate/grid voltage with constant heater

## Development Patterns

### Command Patterns

```bash
npm start              # Dev server with host 0.0.0.0 (container-friendly)
npm run build          # Production build
npm test               # Headless Chrome tests
npm run watch          # Build in watch mode
npm run lint           # ESLint v9 code analysis with new config format
ng generate component  # Standard Angular CLI scaffolding
```

### Routing Structure

Simple two-route application (`src/app/app.routes.ts`):
- `/tube` → TubesComponent (tube list/browser)  
- `/tube/:id` → TubeComponent (individual tube editor)

### Firebase Integration

- **Authentication**: Google OAuth only, stored in `AuthService.user$` observable
- **Firestore**: Collection 'tubes' with ownership field for access control
- **Environment**: Firebase config in `src/environments/environment.ts`

### Testing Strategy

- **Unit tests**: Jasmine/Karma for services and mathematical algorithms
- **Algorithm tests**: Extensive testing in `src/app/workers/algorithms/*.spec.ts`
- **Model validation**: Test files in `src/test-assets/` (ECC83.utd, etc.)

## Code Conventions

### File Organization

- **Components**: Single-purpose with co-located .html/.scss/.spec.ts files
- **Services**: Injectable singletons with reactive patterns (BehaviorSubject)
- **Workers**: Isolated mathematical computation with message passing
- **Models**: Pure functions for tube behavior calculation

### State Management

- Local state: TubeDataService with localStorage persistence
- Remote state: FirebaseTubeService with reactive Firebase integration
- UI state: Component-level with Angular reactive forms

### Error Handling

- Worker errors posted as messages: `{ type: 'error', message: string }`
- Service errors logged to console with user-friendly toast notifications
- File parsing errors gracefully handled with fallback to default data

## Key Integration Points

- **Chart.js**: Custom chart configuration in TubePlotComponent with model overlays
- **Bootstrap 5**: UI framework (v5.3.8) with custom SCSS theming
- **Angular Fire**: Firebase SDK integration (v17.1.0) with v19 compatibility
- **Web Workers**: Heavy computation isolation with TypeScript support

## Current Dependencies (Key Versions)

- **Angular**: v19.2.7 (latest stable)
- **Chart.js**: v4.5.0 for data visualization
- **Firebase**: v10.14.1 for cloud persistence  
- **Bootstrap**: v5.3.8 with Bootstrap Icons v1.13.1
- **mathjs**: v14.7.0 for mathematical operations
- **fraction.js**: v5.2.1 for precise fractional arithmetic
- **ESLint**: v9.36.0 with new flat config format

When working on this codebase, prioritize understanding the mathematical domain (vacuum tube electronics) and the data flow from file upload → parsing → storage → visualization → parameter optimization.
