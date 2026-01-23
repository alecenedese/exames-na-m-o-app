import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Building2, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AccountType = 'user' | 'clinic';

interface OpeningHoursState {
  weekdays: boolean;
  saturday: boolean;
  sunday: boolean;
}

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
  const [openingHours, setOpeningHours] = useState<OpeningHoursState>({
    weekdays: false,
    saturday: false,
    sunday: false,
  });
  
  const { signIn, signUp, signUpClinic } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatOpeningHoursString = (): string => {
    const parts: string[] = [];
    if (openingHours.weekdays) parts.push('Segunda a Sexta');
    if (openingHours.saturday) parts.push('Sábado');
    if (openingHours.sunday) parts.push('Domingo');
    return parts.join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
          navigate('/');
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
              description: 'Você já pode fazer login',
            });
            navigate('/');
          }
        } else {
          // Clinic registration
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
            openingHours: formatOpeningHoursString(),
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
            navigate('/');
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
      <header className="p-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-4 pb-8"
      >
        <h1 className="font-display text-3xl font-bold">
          {isLogin ? 'Bem-vindo!' : 'Criar conta'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLogin 
            ? 'Entre para agendar seus exames' 
            : accountType === 'user' 
              ? 'Preencha os dados para se cadastrar'
              : 'Cadastre sua clínica para receber agendamentos'}
        </p>

        {!isLogin && (
          <Tabs 
            value={accountType} 
            onValueChange={(v) => setAccountType(v as AccountType)}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user" className="gap-2">
                <User className="w-4 h-4" />
                Usuário
              </TabsTrigger>
              <TabsTrigger value="clinic" className="gap-2">
                <Building2 className="w-4 h-4" />
                Clínica
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  <Label htmlFor="name">
                    {accountType === 'user' ? 'Nome completo' : 'Nome do responsável'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={accountType === 'user' ? 'Seu nome' : 'Nome do responsável'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {accountType === 'clinic' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Nome da clínica *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="clinicName"
                          type="text"
                          placeholder="Nome da clínica"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={cnpj}
                          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço completo *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="address"
                          type="text"
                          placeholder="Rua, número, bairro"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="text"
                            placeholder="(00) 0000-0000"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className="pl-9 h-12 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="whatsapp"
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                            className="pl-9 h-12 text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Horário de funcionamento</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="weekdays"
                            checked={openingHours.weekdays}
                            onCheckedChange={(checked) => 
                              setOpeningHours(prev => ({ ...prev, weekdays: checked === true }))
                            }
                          />
                          <label htmlFor="weekdays" className="text-sm cursor-pointer">
                            Segunda a Sexta
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="saturday"
                            checked={openingHours.saturday}
                            onCheckedChange={(checked) => 
                              setOpeningHours(prev => ({ ...prev, saturday: checked === true }))
                            }
                          />
                          <label htmlFor="saturday" className="text-sm cursor-pointer">
                            Sábado
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="sunday"
                            checked={openingHours.sunday}
                            onCheckedChange={(checked) => 
                              setOpeningHours(prev => ({ ...prev, sunday: checked === true }))
                            }
                          />
                          <label htmlFor="sunday" className="text-sm cursor-pointer">
                            Domingo
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : accountType === 'user' ? 'Cadastrar' : 'Cadastrar Clínica'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium text-sm"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}