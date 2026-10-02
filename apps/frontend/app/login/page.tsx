'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ErrorAlert } from '@/components/Layout';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        if (apiClient.isAuthenticated()) {
            router.push('/');
        }
    }, [router]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address (e.g. user@example.com).');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.login(email, password);
            console.log('[LoginPage] response received', response);
            console.log('[LoginPage] response.success =', response?.success);
            if (response.success) {
                // Redirect to dashboard/home
                router.push('/');
            } else {
                setError(response.message || 'Invalid email or password.');
            }
        } catch (err) {
            console.error('[LoginPage] login failed', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-50 via-white to-orange-50/50 p-4 font-sans">
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl shadow-slate-100 p-8 space-y-6">
                
                {/* Logo / Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#E08870] to-[#d67860] text-white shadow-md shadow-orange-100 text-xl font-bold mb-2">
                        T
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                    <p className="text-sm text-gray-500">Sign in to your account to manage your projects</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <ErrorAlert 
                        message={error} 
                        onDismiss={() => setError(null)} 
                    />
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E08870]/40 focus:border-[#E08870] text-sm text-gray-900 placeholder-gray-400 transition-all"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider" htmlFor="password">
                                Password
                            </label>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E08870]/40 focus:border-[#E08870] text-sm text-gray-900 placeholder-gray-400 transition-all"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#E08870] hover:bg-[#d67860] active:scale-[0.98] text-white rounded-xl font-medium text-sm shadow-lg shadow-orange-100 transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none mt-2"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="text-center text-sm text-gray-500 pt-2">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-semibold text-[#E08870] hover:text-[#d67860] transition-colors">
                        Sign Up
                    </Link>
                </div>

            </div>
        </div>
    );
}
