import path from 'path';

/**
 * Test data fixtures for e2e tests
 */
export const TEST_FILES = {
    ECC83: path.join(__dirname, '../../src/test-assets/ECC83.utd'),
    ECC81: path.join(__dirname, '../../src/test-assets/ECC81.utd'),
    ECC82: path.join(__dirname, '../../src/test-assets/ECC82.utd'),
    EF80_200: path.join(__dirname, '../../src/test-assets/EF80_200.utd'),
    EF80_250: path.join(__dirname, '../../src/test-assets/EF80_250.utd'),
    EF80_300: path.join(__dirname, '../../src/test-assets/EF80_300.utd'),
    EF80_TRIODE: path.join(__dirname, '../../src/test-assets/EF80_triode.utd'),
    EL500_200: path.join(__dirname, '../../src/test-assets/EL500_200.utd'),
    EL500_250: path.join(__dirname, '../../src/test-assets/EL500_250.utd'),
    EL500_300: path.join(__dirname, '../../src/test-assets/EL500_300.utd'),
    EL500_TRIODE: path.join(__dirname, '../../src/test-assets/EL500_triode.utd'),
    PF86_TRIODE: path.join(__dirname, '../../src/test-assets/pf86_triode.utd'),
};

/**
 * Sample tube data for testing
 */
export const SAMPLE_TUBE = {
    name: 'Test Tube ECC83',
    type: 'Triode',
    manufacturer: 'Test Manufacturer',
    datasheet: 'https://example.com/datasheet.pdf',
};

/**
 * Expected SPICE parameter names for different tube types
 */
export const SPICE_PARAMETERS = {
    TRIODE: ['mu', 'ex', 'kg1', 'kp', 'kvb'],
    PENTODE: ['mu', 'ex', 'kg1', 'kg2', 'kp', 'kvb', 'kvb2'],
};

/**
 * Timeout values for different operations
 */
export const TIMEOUTS = {
    FILE_UPLOAD: 5000,
    PARAMETER_CALCULATION: 60000,
    PAGE_LOAD: 10000,
    NETWORK_IDLE: 5000,
};
