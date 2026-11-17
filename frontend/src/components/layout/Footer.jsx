import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
      Stockearte &copy; {new Date().getFullYear()} - Hecho con gRPC + NodeJS + React
    </footer>
  );
}
