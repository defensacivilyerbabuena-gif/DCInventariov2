import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase, isSupabaseConfigured } from '../integrations/supabase/client';
import { DYCLogo } from '../components/DYCLogo';
import { AlertTriangle, Database, ShieldAlert } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
  onDemoLogin?: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onDemoLogin }) => {
  
  const handleDemoMode = () => {
    if (onDemoLogin) {
      onDemoLogin({
        id: 'demo-admin',
        name: 'Admin Demo',
        email: 'admin@demo.com',
        role: UserRole.ADMIN
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-white relative z-10">
        <div className="bg-dcRed p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-4 rounded-3xl mb-4 shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
             <DYCLogo className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-white">Defensa Civil</h1>
          <p className="text-dcYellow font-medium">Municipalidad de Yerba Buena</p>
        </div>

        <div className="p-8">
          
          {!isSupabaseConfigured ? (
            <div className="animate-in fade-in space-y-4">
               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center text-amber-800 mb-2">
                    <Database className="w-5 h-5 mr-2" />
                    <h3 className="font-bold">Base de Datos no Conectada</h3>
                  </div>
                  <p className="text-sm text-amber-900 mb-3">
                    La integración con Supabase está lista, pero faltan las credenciales.
                  </p>
                  <p className="text-xs text-amber-700 font-mono bg-amber-100 p-2 rounded mb-3">
                    VITE_SUPABASE_URL<br/>
                    VITE_SUPABASE_ANON_KEY
                  </p>
                  <p className="text-xs text-amber-800">
                    Por favor, crea un proyecto en <a href="https://supabase.com" target="_blank" className="underline font-bold">Supabase.com</a> y proporciona las claves.
                  </p>
               </div>

               <button 
                  onClick={handleDemoMode}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center"
               >
                 <ShieldAlert className="w-4 h-4 mr-2" />
                 Ingresar en Modo Demo (Local)
               </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Acceso al Sistema</h2>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#D32F2F',
                        brandAccent: '#B71C1C',
                        inputBorder: '#d1d5db',
                        inputLabelText: '#1f2937',
                      },
                      radii: {
                        borderRadiusButton: '1rem',
                        inputBorderRadius: '1rem',
                      },
                    },
                  },
                  className: {
                    button: 'font-bold py-3 shadow-md',
                    input: 'font-medium',
                    label: 'font-bold text-gray-800',
                  }
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email Institucional',
                      password_label: 'Contraseña',
                      button_label: 'Ingresar',
                      loading_button_label: 'Verificando...',
                    },
                    sign_up: {
                      email_label: 'Email Institucional',
                      password_label: 'Contraseña',
                      button_label: 'Registrarse',
                      loading_button_label: 'Registrando...',
                      link_text: '¿No tienes cuenta? Regístrate',
                    },
                  },
                }}
                theme="light"
                providers={[]}
              />
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 font-medium">Sistema de Gestión de Inventario v1.5</p>
          </div>
        </div>
      </div>
    </div>
  );
};