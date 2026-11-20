import React from 'react';
import { Github, Linkedin, Cpu, FileCode2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-3.5 px-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Autor */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-200">Stockearte</span>
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span>Desarrollado por <strong className="text-white font-medium">Tomas Strycharski</strong></span>
        </div>

        {/* Stack */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
            <Cpu className="w-3 h-3" />
            gRPC Microservices
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Python</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Node.js</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">PostgreSQL</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">Docker</span>
        </div>

        {/* Links y Swagger */}
        <div className="flex items-center gap-4">
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 text-[11px] font-medium"
            title="Explorar documentación interactiva Swagger"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swagger API</span>
          </a>
          <span className="text-slate-800">|</span>
          <a
            href="https://github.com/Strychi8"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition flex items-center gap-1"
            title="Ver repositorio en GitHub"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub</span>
          </a>
          <a
            href="https://linkedin.com/in/tomas-strycharski"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-brand-400 transition flex items-center gap-1"
            title="Perfil de LinkedIn"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span className="hidden md:inline">LinkedIn</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
