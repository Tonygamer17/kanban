import '@testing-library/jest-dom';

// Mock fetch for Jest environment
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.fetch = require('jest-fetch-mock');