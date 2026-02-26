import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff, Building2, Phone, MapPin, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { OpeningHoursSelector, OpeningHoursState, initialOpeningHours, formatOpeningHoursToString } from '@/components/OpeningHoursSelector';
import { maskCNPJ, maskPhone } from '@/lib/masks';
import { supabase } from '@/integrations/supabase/client';
import logoHero from '@/assets/logo-hero.png';

type AccountType = 'user' | 'clinic';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Clinic fields
  const [clinicName, setClinicName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHoursState>(initialOpeningHours);
  
  const { signIn, signUp, signUpClinic } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatCNPJ = maskCNPJ;
  const formatPhone = maskPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pendingOrder = localStorage.getItem('pending_order');
    const redirectTo = pendingOrder ? '/exames' : (accountType === 'clinic' ? '/admin' : '/');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: error.message === 'Invalid login credentials' 
              ? 'E-mail ou senha incorretos' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          // Check if user is clinic owner to redirect to admin
          const { data: registration } = await supabase
            .from('clinic_registrations')
            .select('id')
            .limit(1)
            .maybeSingle();
          
          if (registration) {
            navigate('/admin', { replace: true });
          } else {
            navigate(redirectTo);
          }
        }
      } else {
        if (accountType === 'user') {
          if (!name.trim()) {
            toast({
              title: 'Nome obrigatório',
              description: 'Por favor, informe seu nome',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
          
          const { error } = await signUp(email, password, name);
          if (error) {
            toast({
              title: 'Erro ao cadastrar',
              description: error.message.includes('already registered')
                ? 'Este e-mail já está cadastrado'
                : error.message,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Cadastro realizado!',
              description: 'Você já pode continuar',
            });
            navigate(redirectTo);
          }
        } else {
          if (!name.trim() || !clinicName.trim() || !cnpj.trim() || !address.trim() || !whatsapp.trim()) {
            toast({
              title: 'Campos obrigatórios',
              description: 'Por favor, preencha todos os campos obrigatórios',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }

          const { error } = await signUpClinic(email, password, {
            responsibleName: name,
            clinicName,
            cnpj: cnpj.replace(/\D/g, ''),
            address,
            phone: phone.replace(/\D/g, ''),
            whatsapp: whatsapp.replace(/\D/g, ''),
            openingHours: formatOpeningHoursToString(openingHours),
          });

          if (error) {
            toast({
              title: 'Erro ao cadastrar',
              description: error.message.includes('already registered')
                ? 'Este e-mail já está cadastrado'
                : error.message,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Cadastro realizado!',
              description: 'Bem-vindo ao Exames na Mão!',
            });
            navigate(redirectTo);
          }
        }
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white safe-area-top border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/">
            <button className="p-1 -ml-1 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <span className="font-semibold">{isLogin ? 'Entrar' : 'Criar conta'}</span>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <img src={logoHero} alt="Exame na Mão" className="w-24" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin 
              ? 'Entre para agendar seus exames' 
              : accountType === 'user' 
                ? 'Preencha os dados para se cadastrar'
                : 'Cadastre sua clínica'}
          </p>
        </motion.div>

        {/* Account type selector for signup */}
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  accountType === 'user' 
                    ? 'bg-white text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                Paciente
              </button>
              <button
                type="button"
                onClick={() => setAccountType('clinic')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  accountType === 'clinic' 
                    ? 'bg-white text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Clínica
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key={accountType}
                initial={{ opacity: 0, x: accountType === 'clinic' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: accountType === 'clinic' ? -20 : 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {accountType === 'user' ? 'Nome completo' : 'Nome do responsável'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={accountType === 'user' ? 'Seu nome' : 'Nome do responsável'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                    />
                  </div>
                </div>

                {accountType === 'clinic' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clinicName" className="text-sm font-medium">Nome da clínica *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="clinicName"
                          type="text"
                          placeholder="Nome da clínica"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          className="pl-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ *</Label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={cnpj}
                          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                          className="pl-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">Endereço completo *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="address"
                          type="text"
                          placeholder="Rua, número, bairro"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="text"
                            placeholder="(00) 0000-0000"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className="pl-10 h-14 rounded-xl bg-muted/50 border-0 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="whatsapp"
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                            className="pl-10 h-14 rounded-xl bg-muted/50 border-0 text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <OpeningHoursSelector 
                      value={openingHours}
                      onChange={setOpeningHours}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 rounded-xl bg-muted/50 border-0 text-base"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25 mt-6" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isLogin ? 'Entrar' : accountType === 'user' ? 'Criar conta' : 'Cadastrar Clínica'
            )}
          </Button>
        </form>

        {/* Toggle login/signup */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          </p>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold text-sm mt-1"
          >
            {isLogin ? 'Criar conta grátis' : 'Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
}