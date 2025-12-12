# TubeModels AI Coding Agent Instructions

## Project Overview

TubeModels is an Angular 20 application for vacuum tube (electron tube) modeling and characteristic analysis. It implements mathematical models (primarily Norman-Koren triode model) to analyze and visualize tube behavior from measurement data.

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

- **TubeDataService** (`src/app/services/tube-data.service.ts`): Local storage and reactive state management using BehaviorSubject
- **FirebaseTubeService** (`src/app/services/firebase-tube.service.ts`): Cloud persistence with ownership-based access control
- **AuthService** (`src/app/services/auth.service.ts`): Google OAuth integration for tube ownership
- **FileParserService** (`src/app/services/file-parser-service.ts`): Automatic measurement type detection and .utd file parsing with statistical analysis
- **ModelService** (`src/app/services/model.service.ts`): SPICE model generation from calculated parameters
- **AnalyticsService** (`src/app/services/analytics.service.ts`): Firebase Analytics integration for tracking user events (tube views, uploads, calculations, disabled in development)
- **CircuitService** (`src/app/services/circuit.service.ts`): SPICE circuit generation for testing tubes with specific load lines and operating points
- **ToastService** (`src/app/services/toast.service.ts`): User notification system with success/error/warning/info/confirm toast types, uses BehaviorSubject for reactive updates

## Mathematical Computing

### Web Worker Architecture

All parameter optimization runs in dedicated worker files to prevent UI blocking:

- **optimize-norman-koren-triode-model-parameters.worker.ts**: Triode model optimization
- **optimize-norman-koren-pentode-model-parameters.worker.ts**: Pentode model optimization  
- **optimize-norman-koren-new-pentode-model-parameters.worker.ts**: New pentode model variant
- **optimize-derk-model-parameters.worker.ts**: Derk pentode model optimization
- **optimize-derke-model-parameters.worker.ts**: Derk-E pentode model optimization

#### Worker Message Protocol

Workers communicate via `postMessage()` with standardized message types:

**Incoming (to worker)**: Receives `{ files: File[], initial?: Initial }` with measurement data

**Outgoing (from worker)**:
- `{ type: 'log', text: string }`: Progress updates with RMSE values and iteration counts
- `{ type: 'parameters', parameters: {...}, rmse: number, calculatedOn: string }`: Final optimized parameters
- `{ type: 'error', message: string }`: Error conditions

Algorithms use Powell and Levenberg-Marquardt methods with configurable tolerance and iteration limits.

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

- **mathjs** (v15.1.0): Vector operations and mathematical functions in `src/app/workers/algorithms/vector.ts`
- Custom numerical algorithms: Gaussian elimination, Newton-Simple-Dogleg in `src/app/workers/algorithms/`

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
- Service errors logged to console with user-friendly toast notifications via ToastService
- File parsing errors gracefully handled with fallback to default data
- Toast notification patterns:
  - `toastService.success()`: Confirmations (5s duration)
  - `toastService.error()`: Errors (7s duration)
  - `toastService.warning()`: Warnings (5s duration)
  - `toastService.info()`: Information (5s duration)
  - `toastService.confirm()`: User confirmations with callbacks (no auto-dismiss)

## Key Integration Points

- **Chart.js**: Custom chart configuration in TubePlotComponent with model overlays
- **Bootstrap 5**: UI framework (v5.3.8) with custom SCSS theming
- **Angular Fire**: Firebase SDK integration (v20.0.1) for Angular 20 compatibility
- **Web Workers**: Heavy computation isolation with TypeScript support

## Current Dependencies (Key Versions)

- **Angular**: v20.3.15 (latest stable)
- **Chart.js**: v4.5.1 for data visualization
- **Firebase**: SDK managed via @angular/fire v20.0.1  
- **Bootstrap**: v5.3.8 with Bootstrap Icons v1.13.1
- **mathjs**: v15.1.0 for mathematical operations
- **ESLint**: v9.39.1 with new flat config format (eslint.config.js)

## Code Style Requirements

### ESLint Configuration (eslint.config.js)

**CRITICAL**: All code MUST follow the ESLint configuration strictly. Run `npm run lint` before committing.

#### Required Style Rules:

- **Indentation**: 4 spaces (enforced by `@stylistic/indent`)
- **Brace style**: Stroustrup style with `allowSingleLine: true`
  ```typescript
  if (condition) {
      // code
  }
  else {
      // code
  }
  ```
- **Semicolons**: Always required (`@stylistic/semi`)
- **Spacing**: Space after commas, space after colons, space before blocks, space around infix operators
- **No trailing spaces**: Enforced by `@stylistic/no-trailing-spaces`
- **End of file**: Files must end with newline (`@stylistic/eol-last`)
- **Angular conventions**: 
  - Component selectors: `app-` prefix with kebab-case
  - Directive selectors: `app` prefix with camelCase

### Comments and Documentation

**Required for all**:
- Services: JSDoc comments describing purpose, parameters, return values
- Complex algorithms: Inline comments explaining mathematical operations
- Worker functions: Document expected input/output message format
- Model parameters: Document physical meaning (e.g., `mu` = amplification factor)

Example from AnalyticsService:
```typescript
/**
 * Service for logging analytics events using Firebase Analytics.
 * Provides methods to track user interactions, custom events, and user properties.
 * Analytics is automatically disabled in development environment.
 */
```

### Unit Testing Requirements

**CRITICAL**: Unit tests are mandatory for:
- All optimization algorithms (`src/app/workers/algorithms/*.spec.ts`)
- Mathematical models and calculation functions
- Services with business logic
- File parsing and data transformation logic

#### Testing Patterns:

**CRITICAL**: ALL unit tests MUST follow the arrange-act-assert (AAA) pattern with explicit comment markers:

```typescript
it('should find the minimum of a simple quadratic function', () => {
    // arrange
    const quadratic = (x: number[]) => x[0] * x[0] + x[1] * x[1];
    const quadraticMinimum = [0, 0];
    const quadraticStart = [1, 1];

    // act
    const result = powell(quadraticStart, quadratic, defaultOptions);

    // assert
    expect(result.converged).toBe(true);
    expect(result.fx).toBeCloseTo(quadratic(quadraticMinimum), 5);
});
```

**AAA Pattern Requirements**:
- **ALWAYS** include `// arrange`, `// act`, `// assert` comments in every test
- **NO empty line** before `// arrange`, `// act`, or `// assert` comments
- **arrange**: Set up test data, mocks, spies, and initial state
- **act**: Execute the function/method being tested (single action when possible)
- **assert**: Verify the expected outcome with expect() statements
- Separate each section with a blank line for readability
- For tests with only setup and assertions (no action), use `// arrange` and `// assert` only
- For async tests with `done` callback, the pattern still applies

**Component Testing with AAA**:
```typescript
it('should display error message when validation fails', () => {
    // arrange
    component.value = 'invalid';
    const errorElement = compiled.query(By.css('.error-message'));

    // act
    component.validate();
    fixture.detectChanges();

    // assert
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent).toContain('Invalid value');
});
```

**Service Testing with AAA**:
```typescript
it('should save tube to localStorage', (done) => {
    // arrange
    const newTube: TubeInformation = {
        id: '',
        name: 'Test Tube',
        type: 'Triode',
        files: []
    };

    // act
    service.saveTube(newTube).subscribe(savedTube => {
        // assert
        const storedData = localStorage.getItem(STORAGE_KEY);
        expect(storedData).toBeTruthy();
        expect(savedTube.id).toBe('6');
        done();
    });
});
```

**Test organization**:
- Group related tests with `describe()` blocks
- Use meaningful test names: "should [expected behavior] when [condition]"
- Test edge cases: negative values, zero, undefined, empty arrays
- Validate convergence for optimization algorithms
- Use `toBeCloseTo()` for floating-point comparisons (specify precision)
- Test files in `src/test-assets/` for integration validation

**Run tests**: `npm test` (headless Chrome with Karma)

**Coverage**: Check `coverage/tube-models/index.html` after test runs

---

When working on this codebase, prioritize understanding the mathematical domain (vacuum tube electronics) and the data flow from file upload → parsing → storage → visualization → parameter optimization.
