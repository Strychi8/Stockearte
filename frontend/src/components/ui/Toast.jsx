import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Componente de notificación flotante para feedback visual de operaciones globales (éxito o error).
// Se posiciona en la esquina inferior de la pantalla y se muestra condicionalmente según el estado recibido.
export default function Toast({ notificacion }) {
  if (!notificacion) return null;

  const isError = notificacion.tipo === 'error';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
        isError
          ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
      ) : (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
      )}
      <span>{notificacion.texto}</span>
    </div>
  );
}
