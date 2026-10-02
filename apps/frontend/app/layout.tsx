import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

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
            <body className="bg-white">
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
