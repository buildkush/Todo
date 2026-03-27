'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string>('checking...');

  useEffect(() => {
    // Test connection to backend
    const checkHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        setHealthStatus('✅ Backend connected!');
      } catch (error) {
        setHealthStatus('❌ Backend not responding');
        console.error('Backend health check failed:', error);
      }
    };

    checkHealth();
  }, []);

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>📝 Todo App</h1>
      
      <div style={{ 
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Status</h2>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
          {healthStatus}
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '20px',
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🚀 Next Steps</h2>
        <ul style={{ 
          listStyle: 'none',
          paddingLeft: '0',
          lineHeight: '1.8'
        }}>
          <li>✅ Frontend running on http://localhost:3000</li>
          <li>✅ Backend connected to http://localhost:5000</li>
          <li>📋 Phase 1: Build projects CRUD API</li>
          <li>🎨 Phase 1: Build Sidebar component</li>
          <li>📝 Phase 1: Create ListView component</li>
        </ul>
      </div>

      <div style={{ marginTop: '40px', color: '#666', fontSize: '0.9rem' }}>
        <p>📚 See documentation: README.md, BRD.md, IMPLEMENTATION_GUIDE.md</p>
      </div>
    </div>
  );
}
