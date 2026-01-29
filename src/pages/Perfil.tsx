import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Mail, Phone, CreditCard, Calendar, ChevronRight, Settings, HelpCircle, Shield } from 'lucide-react';

export default function Perfil() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <>
        <MobileLayout showHeader={false}>
          <div className="min-h-screen bg-background">
            {/* Header */}
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
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="mt-6 rounded-xl font-semibold"
              >
                Entrar na conta
              </Button>
            </div>
          </div>
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  const menuItems = [
    { icon: CreditCard, label: 'CPF', value: profile?.cpf || 'Não informado' },
    { icon: Calendar, label: 'Data de Nascimento', value: profile?.date_of_birth || 'Não informado' },
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
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-bold text-sm text-foreground">Informações pessoais</h3>
              </div>
              
              <div className="divide-y">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {menuItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
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
