
import React from 'react';

export const DYCLogo = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 200 220" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-label="Logo Defensa Civil">
    {/* Triángulo Rojo de fondo */}
    {/* Ajustado para ser equilátero apuntando arriba */}
    <path d="M100 10 L190 160 H10 Z" fill="#D32F2F" />
    
    {/* Círculo Blanco central - Reducido para entrar en el triángulo (Antes r=55) */}
    <circle cx="100" cy="100" r="46" fill="white" />
    
    {/* Letras DYC Estilizadas - Escaladas para entrar en el círculo más pequeño */}
    <g transform="translate(20, 16) scale(0.8)">
        {/* D (Azul Oscuro) - Izquierda */}
        {/* Forma de D gruesa */}
        <path d="M58 75 H70 C82 75 88 85 88 100 C88 115 82 125 70 125 H58 V75 Z" fill="#1A237E" />
        <rect x="63" y="82" width="8" height="36" fill="white" rx="2" /> 
        {/* Nota: Usamos una sustracción visual simple o superposición para la D */}
        <path d="M58 75 H72 C85 75 92 85 92 100 C92 115 85 125 72 125 H58 V75 Z" fill="#283593" />
        {/* Hueco de la D */}
        <path d="M68 85 H70 C78 85 80 90 80 100 C80 110 78 115 70 115 H68 V85 Z" fill="white" />

        {/* Y (Central - Multicolor) */}
        {/* Tallo Verde */}
        <rect x="96" y="100" width="8" height="25" rx="1" fill="#43A047" />
        {/* Brazo Izquierdo (Celeste) */}
        <path d="M96 102 Q 90 85 80 80 L 85 75 Q 100 85 100 102 Z" fill="#039BE5" />
        {/* Brazo Derecho (Naranja) */}
        <path d="M104 102 Q 110 85 120 80 L 115 75 Q 100 85 100 102 Z" fill="#FB8C00" />

        {/* C (Roja/Morada) - Derecha */}
        {/* Forma de C gruesa */}
        <path d="M142 85 L 132 85 C 128 85 122 90 122 100 C 122 110 128 115 132 115 L 142 115 V 125 H 130 C 115 125 110 110 110 100 C 110 90 115 75 130 75 H 142 V 85 Z" fill="#311B92" />
    </g>

    {/* Texto Inferior */}
    <text x="100" y="185" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#1A237E" textAnchor="middle">Municipalidad de Yerba Buena</text>
  </svg>
);
