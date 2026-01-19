import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Mail, Phone } from 'lucide-react';

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
        <MobileLayout title="Perfil">
          <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg">Faça login</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Entre para ver seu perfil e histórico
            </p>
            <Button onClick={() => navigate('/auth')}>Entrar</Button>
          </div>
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <MobileLayout title="Perfil">
        <div className="px-4 pb-24">
          <div className="mt-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <h2 className="font-display font-bold text-xl mt-4">{profile?.name || 'Usuário'}</h2>
          </div>

          <div className="mt-8 space-y-4">
            <div className="card-flat flex items-center gap-4">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="card-flat flex items-center gap-4">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>

          <Button variant="destructive" onClick={handleLogout} className="w-full mt-8">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
}
