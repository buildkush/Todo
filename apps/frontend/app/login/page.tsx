'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { ErrorAlert } from '@/components/Layout';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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
            if (response.success) {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-rose-50/40 p-4 font-sans relative overflow-hidden">
            {/* Ambient Background Decorative Glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-rose-300/20 blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl shadow-rose-950/5 p-8 sm:p-10 space-y-7 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Logo / Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 mb-3 transition-transform hover:scale-105">
                        <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Sign in to manage your workspace & tasks</p>
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
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-0.5" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400 font-medium transition-all"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between pl-0.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider" htmlFor="password">
                                Password
                            </label>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white text-sm text-gray-900 placeholder-gray-400 font-medium transition-all"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none mt-3"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                        {!loading && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="text-center text-xs sm:text-sm text-gray-500 font-medium pt-1 border-t border-gray-100/80">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-bold text-rose-600 hover:text-rose-700 transition-colors">
                        Sign Up
                    </Link>
                </div>

            </div>
        </div>
    );
}
