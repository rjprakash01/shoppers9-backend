import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a simple test page to check if components render correctly.</p>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="text-lg font-semibold">Component Test</h2>
        <p>If you can see this, the component rendering is working fine.</p>
      </div>
    </div>
  );
};

export default TestPage;