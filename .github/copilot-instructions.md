# TubeModels AI Coding Agent Instructions

## Project Overview

TubeModels is an Angular 19 application for vacuum tube (electron tube) modeling and characteristic analysis. It implements mathematical models (primarily Norman-Koren triode model) to analyze and visualize tube behavior from measurement data.

## Core Architecture

### Domain Model

- **TubeInformation** (`src/app/components/tube-information.ts`): Central data structure representing vacuum tubes with electrical specifications, measurement files, and calculated SPICE parameters
- **File/Series/Point** (`src/app/files.ts`): Measurement data structure where Files contain Series (constant voltages) containing Points (individual measurements)
- Tube types: Triode, Pentode, Tetrode with different electrical characteristics

### Key Components

- **TubeComponent**: Main tube editor with tabbed interface (upload, plot, specifications, SPICE parameters)
- **TubesComponent**: List view with Firebase integration for browsing shared tubes
- **TubePlotComponent**: Chart.js visualization with model overlay capability
- **PentodeModelParametersComponent/TetrodeSpiceParametersComponent**: SPICE parameter calculation UI

### Services Architecture

- **TubeDataService**: Local storage and reactive state management using BehaviorSubject
- **FirebaseTubeService**: Cloud persistence with ownership-based access control
- **AuthService**: Google OAuth integration for tube ownership
- **FileParserService**: Automatic measurement type detection and .utd file parsing

## Mathematical Computing

### Web Worker Architecture

All parameter optimization runs in `optimize-norman-koren-triode-model-parameters.worker.ts` to prevent UI blocking:

- **Powell algorithm** (`src/app/workers/algorithms/powell.ts`): Derivative-free optimization
- **Levenberg-Marquardt** (`src/app/workers/algorithms/Levenberg-Marquardt.ts`): Non-linear least squares
- **Norman-Koren Model** (`src/app/workers/models/norman-koren-triode-model.ts`): Core tube model using parameters (mu, ex, kg1, kg2, kp, kvb)

### Mathematical Libraries

- **mathjs**: Vector operations and mathematical functions in `src/app/workers/algorithms/vector.ts`
- **Custom algorithms**: Gaussian elimination, Newton-Simple-Dogleg for numerical optimization

## Data Import Workflow

### .utd File Format

Tab-delimited files with columns: `Point`, `Curve`, `Ia (mA)`, `Vg (V)`, `Va (V)`, `Vs (V)`, `Is (mA)`, `Vf (V)`

- **Point**: Measurement sequence number
- **Curve**: Series identifier (constant grid voltage curves)
- **Ia**: Plate current, **Is**: Screen current, **Vg**: Grid voltage, **Va**: Plate voltage, **Vs**: Screen voltage, **Vf**: Heater voltage

### Measurement Type Detection

FileParserService automatically detects measurement types like:

- `IP_EG_EP_VH`: Plate current vs grid/plate voltage with constant heater
- `IP_EP_EG_VH`: Plate current vs plate/grid voltage with constant heater

## Development Patterns

### Command Patterns

```bash
npm start              # Dev server with host 0.0.0.0 (container-friendly)
npm run build          # Production build
npm test               # Headless Chrome tests
ng generate component  # Standard Angular CLI scaffolding
```

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
- **Bootstrap 5**: UI framework with custom SCSS theming
- **Angular Fire**: Firebase SDK integration with v19 compatibility
- **Web Workers**: Heavy computation isolation with TypeScript support

When working on this codebase, prioritize understanding the mathematical domain (vacuum tube electronics) and the data flow from file upload → parsing → storage → visualization → parameter optimization.
