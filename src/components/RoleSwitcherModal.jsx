import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadAvatarToSupabase, updateProfileInSupabase } from '../lib/supabaseStorage';
import {
  X,
  User,
  Mail,
  Lock,
  Camera,
  Save,
  LogOut,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Upload
} from 'lucide-react';

export default function RoleSwitcherModal({ isOpen, onClose }) {
  const { currentUser, setCurrentUser, updateUserProfile, refreshUsersFromSupabase, showToast, logout } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatar || '');
      setPassword('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 10MB.', 'error');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const newAvatarUrl = await uploadAvatarToSupabase(file, currentUser.id, avatar);

      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        if (updateUserProfile) {
          updateUserProfile({ ...currentUser, avatar: newAvatarUrl });
        }
        showToast('Foto atualizada e salva no Supabase Storage!');
      } else {
        showToast('Não foi possível enviar a foto. Tente novamente.', 'error');
      }
    } catch (err) {
      console.error('Erro ao subir imagem no Supabase Storage:', err);
      showToast('Erro ao enviar imagem. Verifique a conexão.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome não pode ficar em branco.', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('O e-mail não pode ficar em branco.', 'error');
      return;
    }

    setIsSaving(true);

    const updatedUser = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      avatar: avatar.trim(),
      password: password
    };

    // 1. Atualizar Estado React local, lista global de usuários e LocalStorage
    if (updateUserProfile) {
      updateUserProfile(updatedUser);
    } else {
      setCurrentUser(updatedUser);
      localStorage.setItem('rodin_current_user', JSON.stringify(updatedUser));
    }

    // 2. Enviar atualização em tempo real para a tabela public.profiles do Supabase
    const isSynced = await updateProfileInSupabase(updatedUser);
    if (refreshUsersFromSupabase) {
      await refreshUsersFromSupabase();
    }
    if (isSynced) {
      showToast('Perfil atualizado no site e sincronizado no Supabase!');
    } else {
      showToast('Perfil salvo com sucesso!');
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-[94%] border border-[#E2E8F0] shadow-2xl modal-container-popup relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Compacto */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF0E6] flex items-center justify-center text-[#F45206]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold text-[#1E293B]">
                Configurações do Meu Perfil
              </h2>
              <p className="text-[11px] font-medium text-[#64748B]">
                Gerencie seus dados pessoais, foto e senha de acesso.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#F45206] hover:text-white flex items-center justify-center text-[#64748B] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile}>
          {/* Layout Horizontal de 2 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            {/* Coluna Esquerda: Foto & Cargo */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] gap-4 text-center">
              <div className="relative group">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#F45206] shadow-md bg-[#F1F5F9]">
                  <img
                    src={avatar || currentUser.avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                      <Loader2 size={18} className="animate-spin text-[#F45206]" />
                      <span>Subindo...</span>
                    </div>
                  )}
                </div>

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F45206] text-white flex items-center justify-center cursor-pointer shadow hover:bg-[#D94400] transition-colors border-2 border-white"
                  title="Carregar Nova Foto (Supabase Storage)"
                >
                  <Camera size={15} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#1E293B] hover:border-[#F45206] hover:text-[#F45206] transition-colors cursor-pointer shadow-xs"
                >
                  <Upload size={14} className="text-[#F45206]" />
                  <span>Alterar Foto de Perfil</span>
                </label>
                <p className="text-[9px] text-[#64748B] font-medium max-w-[180px] mx-auto leading-tight pt-1">
                  A foto é sincronizada e hospedada no Supabase Storage.
                </p>
              </div>

              {/* Cargo Operacional */}
              <div className="w-full pt-3 border-t border-[#E2E8F0]">
                <span className="text-[9px] font-extrabold uppercase text-[#64748B] block mb-1">
                  Cargo Operacional:
                </span>
                <span className="text-[10px] font-black text-[#F45206] uppercase bg-[#FFF0E6] px-3 py-1 rounded-full inline-block border border-[#FED7AA] tracking-wider">
                  {currentUser.roleLabel}
                </span>
              </div>
            </div>

            {/* Coluna Direita: Formulário de Dados */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-center">
              {/* Campo Nome */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#404545] mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              {/* Campo E-mail */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#404545] mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
                    placeholder="seu.email@colegiorodin.com.br"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#404545] mb-1">
                  Alterar Senha
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
                    placeholder="Digite a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F45206] cursor-pointer p-0.5"
                    title={showPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-xs font-extrabold hover:bg-[#FEE2E2] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Encerrar Sessão"
            >
              <LogOut size={14} />
              <span>Sair do Sistema</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-[#1E293B] text-xs font-bold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingPhoto}
                className="px-5 py-2 rounded-xl bg-[#F45206] text-white text-xs font-extrabold hover:bg-[#D94400] transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#F45206]/20 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Perfil'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
