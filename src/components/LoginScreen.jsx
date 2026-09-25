import React, { useState } from 'react';
import { useApp, PRESET_USERS } from '../context/AppContext';
import RodinLogo from './RodinLogo';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function LoginScreen() {
  const { login, PRESET_USERS: contextUsers } = useApp() || {};
  const usersList = (contextUsers && Array.isArray(contextUsers) && contextUsers.length > 0)
    ? contextUsers
    : (Array.isArray(PRESET_USERS) ? PRESET_USERS : []);

  const [identifier, setIdentifier] = useState('matheus.admin@colegiorodin.com.br');
  const [password, setPassword] = useState('rodin2027');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier) {
      setErrorMsg('Informe seu e-mail, CPF ou código RM.');
      return;
    }

    if (!password) {
      setErrorMsg('Informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Buscar usuário real na lista de usuários cadastrados
      const foundUser = usersList.find(u => 
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        (u.name && u.name.toLowerCase() === cleanIdentifier) ||
        (u.name && u.name.toLowerCase().includes(cleanIdentifier)) ||
        (u.role && u.role.toLowerCase() === cleanIdentifier) ||
        (u.id && u.id.toLowerCase() === cleanIdentifier)
      );

      if (!foundUser) {
        setErrorMsg('E-mail ou credencial não encontrada no sistema Colégio Rodin.');
        setIsLoading(false);
        return;
      }

      if (login) {
        login(foundUser);
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F6F4EF] flex flex-col items-center justify-center p-4 font-sans select-none overflow-x-hidden">
      {/* Central Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-xl border border-[#E2E8F0] animate-fadeIn">
        {/* Logo Centralizada */}
        <div className="flex justify-center mb-6">
          <RodinLogo variant="color" className="h-12 w-auto" alt="Colégio Rodin" />
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-2.5 text-xs font-bold text-[#DC2626] animate-clean-fade">
            <AlertCircle size={16} className="shrink-0 text-[#DC2626]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário Minimalista de Login */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#404545] mb-1.5">
              E-mail, CPF ou RM
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="seu.email@colegiorodin.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] bg-white focus:outline-none focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#404545]">
                Senha
              </label>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] bg-white focus:outline-none focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F45206] cursor-pointer p-1 rounded-md transition-colors"
                title={showPassword ? 'Ocultar Senha' : 'Exibir Senha em Texto'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#F45206] focus:ring-[#F45206] border-[#CBD5E1] cursor-pointer"
              />
              <span className="text-xs font-medium text-[#64748B]">Manter conectado</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#F45206] hover:bg-[#D94400] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#F45206]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span>Verificando Acesso...</span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
