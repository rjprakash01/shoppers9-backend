// Basic test to verify Jest setup
describe('Basic Test Suite', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('String operations work', () => {
    const greeting = 'Hello World';
    expect(greeting).toContain('World');
  });

  test('Array operations work', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  test('Object operations work', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('John');
  });
});