import { createClient } from '@supabase/supabase-js';

// Robustly retrieve environment variables
const getEnv = (key: string) => {
  // 1. Try process.env (Node-like environments)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  // 2. Try import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  
  return '';
};

// Configuración extraída de las credenciales proporcionadas
const PROJECT_REF = 'xdphodtljtvazeokiolb';
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcGhvZHRsanR2YXplb2tpb2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzM5OTEsImV4cCI6MjA4MDgwOTk5MX0.KNfQdUKMU6L9GdMPKSvhzS9THfOdU-Vqnem5wdWXLd4';

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || PROJECT_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || ANON_KEY;

const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

export const isSupabaseConfigured = !isPlaceholder;

// Provide fallback values to prevent "supabaseUrl is required" crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);