import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Mail, Phone, CreditCard, Calendar, ChevronRight, HelpCircle, Shield, Pencil, Check, X } from 'lucide-react';
import { maskPhone, maskCPF } from '@/lib/masks';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    cpf: '',
    rg: '',
    date_of_birth: '',
  });

  const startEditing = () => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      cpf: profile?.cpf || '',
      rg: profile?.rg || '',
      date_of_birth: profile?.date_of_birth || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Perfil atualizado!');
      setEditing(false);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <>
        <MobileLayout showHeader={false}>
          <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 pt-12 pb-8 safe-area-top">
              <h1 className="text-xl font-bold">Meu Perfil</h1>
              <p className="text-slate-300 text-sm mt-1">Gerencie sua conta</p>
            </div>
            <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-bold text-xl">Faça login</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Entre para ver seu perfil e histórico
              </p>
              <Button onClick={() => navigate('/auth')} size="lg" className="mt-6 rounded-xl font-semibold">
                Entrar na conta
              </Button>
            </div>
          </div>
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  const infoFields = [
    { icon: Phone, label: 'Telefone', key: 'phone' as const, type: 'tel' },
    { icon: CreditCard, label: 'CPF', key: 'cpf' as const, type: 'text' },
    { icon: CreditCard, label: 'RG', key: 'rg' as const, type: 'text' },
    { icon: Calendar, label: 'Data de Nascimento', key: 'date_of_birth' as const, type: 'date' },
  ];

  return (
    <>
      <MobileLayout showHeader={false}>
        <div className="min-h-screen bg-background">
          {/* Header with avatar */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 pt-12 pb-8 safe-area-top">
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
              >
                <span className="text-2xl font-bold text-white">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold">{profile?.name || 'Usuário'}</h1>
                <p className="text-slate-300 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="px-4 pb-24 -mt-2">
            {/* Info cards */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Informações pessoais</h3>
                {!editing ? (
                  <button onClick={startEditing} className="flex items-center gap-1 text-xs text-primary font-semibold">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Check className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="divide-y">
                {/* Email (read-only) */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>

                {/* Name */}
                {editing ? (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 rounded-lg" />
                    </div>
                  </div>
                ) : null}

                {/* Editable fields */}
                {infoFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <field.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                      {editing ? (
                        <Input
                          type={field.type}
                          value={form[field.key] || ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="h-9 rounded-lg"
                        />
                      ) : (
                        <p className="text-sm font-medium">{(profile as any)?.[field.key] || 'Não informado'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 bg-card rounded-2xl border shadow-sm overflow-hidden"
            >
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium text-sm">Ajuda e suporte</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="border-t" />
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium text-sm">Privacidade</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </motion.div>

            {/* Logout button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="w-full h-12 rounded-xl font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <LogOut className="w-5 h-5 mr-2" /> 
                Sair da conta
              </Button>
            </motion.div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Versão 1.0.0
            </p>
          </div>
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
}
