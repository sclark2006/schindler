import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Key, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            if (response.data.access_token) {
                login(username, response.data.access_token);
                // AuthContext triggers redirect via App logic or here directly?
                // For simplified flow, App.tsx will check isAuthenticated and render Dashboard
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Credenciales inválidas. Intente admin/password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
                    <ShieldCheck size={48} className="mx-auto mb-4 opacity-90" />
                    <h1 className="text-3xl font-bold mb-2">Schindler Migration</h1>
                    <p className="opacity-80 text-sm">Forms to Java Analysis Tool</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                                <Lock size={16} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Ingrese usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-blue-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-400">
                        &copy; 2026 Schindler Migration Project. Protected System.
                    </div>
                </div>
            </div>
        </div>
    );
};
