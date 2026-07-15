import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const AuthForm = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = isSignUp
                ? await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { onboarding_completed: false }
                    }
                })
                : await supabase.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                toast.error("Error de autenticación", {
                    description: error.message
                });
            } else {
                toast.success(isSignUp ? "¡Bienvenida a MAIA! Revisa tu email." : "¡Qué alegría verte de nuevo! ✨");
            }
        } catch (err) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) toast.error("Error al conectar con Google");
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
            <div className="w-full max-w-md space-y-6">

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#7A9482]/10 space-y-6">
                    {/* Selector de modo (Tab) */}
                    <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isSignUp ? 'bg-white text-[#7A9482] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isSignUp ? 'bg-white text-[#7A9482] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Crear cuenta
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#7A9482]/20 focus:bg-white outline-none transition-all text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="Tu contraseña"
                                    className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#7A9482]/20 focus:bg-white outline-none transition-all text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#7A9482] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-[#7A9482]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Cargando...' : (isSignUp ? 'Empezar ahora' : 'Ingresar')}
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">o únete con</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                        <Chrome size={20} className="text-[#4285F4]" />
                        Google
                    </button>
                </div>

                <p className="text-center text-[11px] text-gray-400 leading-relaxed px-10">
                    Al continuar, aceptas que cuidemos tus datos con el mismo cariño que cuidas a tu bebé.
                </p>
            </div>
        </div>
    );
};