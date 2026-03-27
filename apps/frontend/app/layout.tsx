import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'Hierarchical todo management with List and Board views',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar will go here (Phase 1) */}
          <nav
            style={{
              width: '250px',
              backgroundColor: '#f1f5f9',
              borderRight: '1px solid #e2e8f0',
              padding: '20px',
              display: 'none', // Hidden until Phase 1
            }}
          >
            <h2>Tasks</h2>
          </nav>

          {/* Main content */}
          <main style={{ flex: 1, padding: '20px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
