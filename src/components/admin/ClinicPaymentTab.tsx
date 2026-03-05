import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Copy, Check, Loader2, ExternalLink, CreditCard, Crown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PaymentResult {
  payment: { id: string; value: number; status: string; invoiceUrl: string; dueDate?: string };
  pix?: { qrCodeImage: string; qrCodePayload: string; expirationDate: string } | null;
}

interface SubscriptionHistoryItem {
  id: string;
  plan: string;
  amount: number;
  payment_method: string | null;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  expires_at: string | null;
}

interface Plan {
  id: 'anual' | 'semestral';
  label: string;
  price: number;
  pixPrice: number;
  installments: number;
  installmentValue: number;
  description: string;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: 'anual',
    label: 'Anual',
    price: 479.00,
    pixPrice: 455.05,
    installments: 12,
    installmentValue: 39.90,
    description: 'Melhor custo-benefício',
    badge: 'Mais popular',
  },
  {
    id: 'semestral',
    label: 'Semestral',
    price: 5.00,
    pixPrice: 5.00,
    installments: 6,
    installmentValue: Math.ceil((5.00 / 6) * 100) / 100,
    description: '6 meses de acesso',
  },
];

const getMonthlyPrice = (plan: Plan) => plan.installmentValue;

interface ClinicPaymentTabProps {
  onPaymentConfirmed?: () => void;
  onEditProfile?: () => void;
}

export function ClinicPaymentTab({ onPaymentConfirmed, onEditProfile }: ClinicPaymentTabProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [selectedPlan, setSelectedPlan] = useState<'anual' | 'semestral'>('anual');
  const [paymentHistory, setPaymentHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [showEditButton, setShowEditButton] = useState(false);
  const [clinicCnpj, setClinicCnpj] = useState<string | null>(null);
  const [clinicPhone, setClinicPhone] = useState<string | null>(null);

  // Fetch clinic CNPJ and phone from registration
  useEffect(() => {
    async function fetchClinicData() {
      if (!user) return;
      const { data } = await supabase
        .from('clinic_registrations')
        .select('cnpj, phone, whatsapp')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.cnpj) {
        setClinicCnpj(data.cnpj.replace(/\D/g, ''));
      }
      if (data?.phone || data?.whatsapp) {
        setClinicPhone((data.phone || data.whatsapp).replace(/\D/g, ''));
      }
    }
    fetchClinicData();
  }, [user]);

  useEffect(() => {
    async function fetchPaymentHistory() {
      if (!user) {
        setPaymentHistory([]);
        return;
      }

      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('clinic_subscriptions')
          .select('id, plan, amount, payment_method, payment_status, paid_at, created_at, expires_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPaymentHistory(data ?? []);
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchPaymentHistory();
  }, [user, paymentResult]);

  const isValidCPF = (cpf: string) => {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== Number(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === Number(cpf[10]);
  };

  const isValidCNPJ = (cnpj: string) => {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(cnpj[i]) * w1[i];
    let rest = sum % 11;
    const d1 = rest < 2 ? 0 : 11 - rest;
    if (Number(cnpj[12]) !== d1) return false;
    sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(cnpj[i]) * w2[i];
    rest = sum % 11;
    const d2 = rest < 2 ? 0 : 11 - rest;
    return Number(cnpj[13]) === d2;
  };

  const getDocumento = () => {
    const cnpj = clinicCnpj?.replace(/\D/g, '') || '';
    const cpf = profile?.cpf?.replace(/\D/g, '') || '';

    if (cnpj) {
      if (isValidCNPJ(cnpj)) return cnpj;
      if (cpf && isValidCPF(cpf)) return cpf;
      return '';
    }

    if (cpf && isValidCPF(cpf)) return cpf;
    return '';
  };
  // Card form state
  const [cardData, setCardData] = useState({
    number: '', holderName: '', expiryMonth: '', expiryYear: '', ccv: '',
  });
  const [holderInfo, setHolderInfo] = useState({
    name: '', email: '', cpfCnpj: '', postalCode: '', addressNumber: '', phone: '',
  });
  const [address, setAddress] = useState({ street: '', neighborhood: '', city: '', state: '' });
  const [fetchingCep, setFetchingCep] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);

  const currentPlan = plans.find(p => p.id === selectedPlan)!;

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const handleCepBlur = async () => {
    const cep = holderInfo.postalCode.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress({
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        });
      } else {
        toast({ title: 'CEP não encontrado', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao buscar CEP', variant: 'destructive' });
    } finally {
      setFetchingCep(false);
    }
  };

  const getPlanDescription = () => {
    return currentPlan.id === 'anual'
      ? 'Plano Clínica - Exames na Mão (Anual)'
      : 'Plano Clínica - Exames na Mão (Semestral)';
  };

  const handleGeneratePix = async () => {
    const doc = getDocumento();
    if (!doc) {
      toast({ title: 'Documento inválido', description: 'Corrija o CNPJ da clínica ou informe um CPF válido.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: {
          action: 'create-pix',
          name: profile?.name || '',
          cpfCnpj: doc,
          email: user?.email || '',
          phone: profile?.phone?.replace(/\D/g, '') || clinicPhone || '',
          value: currentPlan.pixPrice,
          description: getPlanDescription(),
          plan: selectedPlan,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setPaymentResult(data);
      toast({ title: 'PIX gerado!', description: 'Escaneie o QR Code ou copie o código.' });
    } catch (err: any) {
      console.error(err);
      const message = err?.context?.json?.error || err?.message || 'Não foi possível gerar o PIX.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      setShowEditButton(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = getDocumento();
    if (!doc) {
      toast({ title: 'Documento necessário', description: 'CNPJ ou CPF não encontrado.', variant: 'destructive' });
      return;
    }
    const cep = holderInfo.postalCode.replace(/\D/g, '');
    if (cep.length !== 8) {
      toast({ title: 'CEP inválido', description: 'Informe um CEP válido de 8 dígitos.', variant: 'destructive' });
      return;
    }
    if (!address.street) {
      toast({ title: 'Endereço necessário', description: 'Busque o CEP para preencher o endereço.', variant: 'destructive' });
      return;
    }
    if (!holderInfo.addressNumber) {
      toast({ title: 'Número obrigatório', description: 'Informe o número do endereço.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: {
          action: 'create-credit-card',
          name: profile?.name || '',
          cpfCnpj: doc,
          email: holderInfo.email,
          phone: holderInfo.phone?.replace(/\D/g, '') || profile.phone?.replace(/\D/g, '') || clinicPhone || '',
          value: currentPlan.price,
          installmentCount: installmentCount > 1 ? installmentCount : undefined,
          description: getPlanDescription(),
          plan: selectedPlan,
          creditCard: {
            holderName: cardData.holderName,
            number: cardData.number.replace(/\s/g, ''),
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            ccv: cardData.ccv,
          },
          holderInfo: {
            name: holderInfo.name || cardData.holderName,
            email: holderInfo.email,
            cpfCnpj: holderInfo.cpfCnpj?.replace(/\D/g, '') || profile.cpf.replace(/\D/g, ''),
            postalCode: cep,
            addressNumber: holderInfo.addressNumber,
            phone: holderInfo.phone?.replace(/\D/g, '') || profile.phone?.replace(/\D/g, '') || clinicPhone || '',
          },
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setPaymentResult(data);
      onPaymentConfirmed?.();
      toast({ title: '🎉 Pagamento aprovado!', description: 'Seu plano foi ativado com sucesso.' });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Não foi possível processar o cartão.';
      toast({ title: 'Erro no pagamento', description: msg, variant: 'destructive' });
      setShowEditButton(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!paymentResult?.pix?.qrCodePayload) return;
    navigator.clipboard.writeText(paymentResult.pix.qrCodePayload);
    setCopied(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCheckStatus = async () => {
    if (!paymentResult?.payment?.id) return;
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: { action: 'check-status', paymentId: paymentResult.payment.id },
      });
      if (error) throw error;
      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        onPaymentConfirmed?.();
        toast({ title: '🎉 Pagamento confirmado!', description: 'Seu plano foi ativado.' });
      } else if (data.status === 'PENDING') {
        toast({ title: 'Aguardando', description: 'Ainda não identificamos o pagamento.' });
      } else {
        toast({ title: `Status: ${data.status}` });
      }
    } catch {
      toast({ title: 'Erro ao verificar status', variant: 'destructive' });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Auto-poll payment status every 10s after PIX generation
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!paymentResult?.payment?.id || !paymentResult?.pix) return;
    
    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('asaas-payment', {
          body: { action: 'check-status', paymentId: paymentResult.payment.id },
        });
        if (error) return;
        if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
          stopPolling();
          onPaymentConfirmed?.();
          toast({ title: '🎉 Pagamento confirmado!', description: 'Seu plano foi ativado automaticamente.' });
        }
      } catch {}
    };

    pollingRef.current = setInterval(checkPayment, 10000);
    // Also check immediately after 5s
    const initialCheck = setTimeout(checkPayment, 5000);

    return () => {
      stopPolling();
      clearTimeout(initialCheck);
    };
  }, [paymentResult?.payment?.id, paymentResult?.pix, onPaymentConfirmed, stopPolling, toast]);

  // Payment result screen
  if (paymentResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {paymentResult.pix?.qrCodeImage && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${paymentResult.pix.qrCodeImage}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
            )}

            {paymentResult.pix?.qrCodePayload && (
              <div className="space-y-2">
                <Label>Código PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input value={paymentResult.pix.qrCodePayload} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyPix}>
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {!paymentResult.pix && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Pagamento processado!</h3>
                <p className="text-sm text-muted-foreground mt-1">Status: {paymentResult.payment.status}</p>
              </div>
            )}

            {paymentResult.payment.invoiceUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={paymentResult.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver fatura completa
                </a>
              </Button>
            )}

            {paymentResult.pix && (
              <Button variant="secondary" className="w-full" onClick={handleCheckStatus} disabled={checkingStatus}>
                {checkingStatus ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : 'Já paguei - Verificar'}
              </Button>
            )}

            <Button variant="ghost" className="w-full" onClick={() => setPaymentResult(null)}>
              Gerar novo pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div>
        <h3 className="font-semibold text-base mb-3">Escolha seu plano</h3>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan.id);
                setInstallmentCount(1);
              }}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all",
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/40"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}
              <p className="font-bold text-base">{plan.label}</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(getMonthlyPrice(plan))}
                <span className="text-xs font-normal text-muted-foreground">/mês</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(plan.price)} (até {plan.installments}x)
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                PIX: {formatCurrency(plan.pixPrice)} (5% off)
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'pix' | 'card')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pix" className="gap-2">
            <QrCode className="w-4 h-4" />
            PIX
          </TabsTrigger>
          <TabsTrigger value="card" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Cartão
          </TabsTrigger>
        </TabsList>

        {/* PIX Tab */}
        <TabsContent value="pix" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">5% de desconto no PIX!</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">{formatCurrency(currentPlan.pixPrice)}</p>
                <p className="text-xs text-muted-foreground line-through">{formatCurrency(currentPlan.price)}</p>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Gere um QR Code PIX para pagamento à vista</p>
                <Button onClick={handleGeneratePix} disabled={loading} className="w-full h-12">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando PIX...</> : <><QrCode className="w-4 h-4 mr-2" />Gerar QR Code PIX</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Card Tab */}
        <TabsContent value="card" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCardPayment} className="space-y-4">
                {/* Installments */}
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <select
                    id="installments"
                    className="w-full h-12 rounded-md border border-input bg-background px-3 text-sm"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  >
                    {Array.from({ length: currentPlan.installments }, (_, i) => i + 1).map((n) => {
                      const val = currentPlan.price / n;
                      return (
                        <option key={n} value={n}>
                          {n}x de {formatCurrency(val)} {n === 1 ? '(à vista)' : 'sem juros'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Card info */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.number}
                    onChange={(e) => setCardData(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holderName">Nome no cartão</Label>
                  <Input
                    id="holderName"
                    placeholder="Como está no cartão"
                    value={cardData.holderName}
                    onChange={(e) => setCardData(p => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                    className="h-12"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Mês</Label>
                    <Input
                      id="expiryMonth"
                      placeholder="MM"
                      value={cardData.expiryMonth}
                      onChange={(e) => setCardData(p => ({ ...p, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Ano</Label>
                    <Input
                      id="expiryYear"
                      placeholder="AAAA"
                      value={cardData.expiryYear}
                      onChange={(e) => setCardData(p => ({ ...p, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ccv">CVV</Label>
                    <Input
                      id="ccv"
                      placeholder="000"
                      value={cardData.ccv}
                      onChange={(e) => setCardData(p => ({ ...p, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      className="h-12"
                      type="password"
                      required
                    />
                  </div>
                </div>

                {/* Billing address */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-sm mb-3">Endereço de cobrança</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="holderEmail">E-mail do titular</Label>
                    <Input
                      id="holderEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={holderInfo.email}
                      onChange={(e) => setHolderInfo(p => ({ ...p, email: e.target.value }))}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="holderCpf">CPF do titular</Label>
                    <Input
                      id="holderCpf"
                      placeholder="000.000.000-00"
                      value={holderInfo.cpfCnpj}
                      onChange={(e) => setHolderInfo(p => ({ ...p, cpfCnpj: e.target.value }))}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={holderInfo.postalCode}
                        onChange={(e) => setHolderInfo(p => ({ ...p, postalCode: e.target.value }))}
                        onBlur={handleCepBlur}
                        className="h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressNumber">Número</Label>
                      <Input
                        id="addressNumber"
                        placeholder="Nº"
                        value={holderInfo.addressNumber}
                        onChange={(e) => setHolderInfo(p => ({ ...p, addressNumber: e.target.value }))}
                        className="h-12"
                        required
                      />
                    </div>
                  </div>

                  {fetchingCep && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Buscando endereço...
                    </div>
                  )}

                  {address.street && (
                    <div className="mt-3 p-3 bg-muted rounded-lg text-sm space-y-1">
                      <p><strong>Rua:</strong> {address.street}</p>
                      <p><strong>Bairro:</strong> {address.neighborhood}</p>
                      <p><strong>Cidade:</strong> {address.city} - {address.state}</p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                  ) : (
                    installmentCount > 1
                      ? `Pagar ${installmentCount}x de ${formatCurrency(currentPlan.price / installmentCount)}`
                      : `Pagar ${formatCurrency(currentPlan.price)}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showEditButton && onEditProfile && (
        <Button variant="outline" className="w-full" onClick={onEditProfile}>
          <Settings className="w-4 h-4 mr-2" />
          Editar dados de cadastro
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Pagamento seguro processado via Asaas.
      </p>
    </div>
  );
}
