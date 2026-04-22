import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { type User } from '@supabase/supabase-js';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [hasProfile, setHasProfile] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    // Función simplificada para checar perfil
    const checkProfileStatus = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('perfiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            setHasProfile(!!data);
        } catch (err) {
            console.error("Error en perfil:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Verificar sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                checkProfileStatus(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Escuchar cambios (Login/Logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                checkProfileStatus(currentUser.id);
            } else {
                setHasProfile(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []); // El array vacío es vital para evitar el bucle infinito

    return { user, hasProfile, loading, setHasProfile };
};