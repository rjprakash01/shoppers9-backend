// Basic LoadingSpinner component tests
describe('LoadingSpinner Component', () => {
  test('component exists and can be imported', () => {
    // Test that the component can be imported without errors
    const LoadingSpinner = require('./LoadingSpinner').default;
    expect(LoadingSpinner).toBeDefined();
    expect(typeof LoadingSpinner).toBe('function');
  });

  test('ButtonSpinner component exists', () => {
    const { ButtonSpinner } = require('./LoadingSpinner');
    expect(ButtonSpinner).toBeDefined();
    expect(typeof ButtonSpinner).toBe('function');
  });

  test('InlineSpinner component exists', () => {
    const { InlineSpinner } = require('./LoadingSpinner');
    expect(InlineSpinner).toBeDefined();
    expect(typeof InlineSpinner).toBe('function');
  });

  test('CardLoadingState component exists', () => {
    const { CardLoadingState } = require('./LoadingSpinner');
    expect(CardLoadingState).toBeDefined();
    expect(typeof CardLoadingState).toBe('function');
  });

  
  test('validation utility functions exist', () => {
    // Test validation patterns
    const { validationPatterns } = require('../utils/validation');
    expect(validationPatterns).toBeDefined();
    expect(validationPatterns.email).toBeDefined();
    expect(validationPatterns.phone).toBeDefined();
  });

  test('form components can be imported', () => {
    const { TextInput, PasswordInput, Textarea } = require('./forms/FormComponents');
    expect(TextInput).toBeDefined();
    expect(PasswordInput).toBeDefined();
    expect(Textarea).toBeDefined();
  });

  test('SEO component can be imported', () => {
    const SEO = require('./SEO').default;
    expect(SEO).toBeDefined();
    expect(typeof SEO).toBe('function');
  });

  test('error boundary component can be imported', () => {
    const ErrorBoundary = require('./ErrorBoundary').default;
    expect(ErrorBoundary).toBeDefined();
  });

  test('skeleton loader components can be imported', () => {
    const { ProductCardSkeleton, TableSkeleton } = require('./SkeletonLoader');
    expect(ProductCardSkeleton).toBeDefined();
    expect(TableSkeleton).toBeDefined();
  });
});