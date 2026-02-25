import { useState } from 'react';
import { QrCode, Copy, Check, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PaymentResult {
  payment: { id: string; value: number; status: string; invoiceUrl: string; dueDate?: string };
  pix?: { qrCodeImage: string; qrCodePayload: string; expirationDate: string } | null;
}

export function ClinicPaymentTab() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const { toast } = useToast();
  const { profile } = useAuth();

  // Card form state
  const [cardData, setCardData] = useState({
    number: '', holderName: '', expiryMonth: '', expiryYear: '', ccv: '',
  });
  const [holderInfo, setHolderInfo] = useState({
    name: '', email: '', cpfCnpj: '', postalCode: '', addressNumber: '', phone: '',
  });
  const [address, setAddress] = useState({ street: '', neighborhood: '', city: '', state: '' });
  const [fetchingCep, setFetchingCep] = useState(false);

  const planPrice = 99.90;

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);

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

  const handleGeneratePix = async () => {
    if (!profile?.cpf) {
      toast({ title: 'CPF necessário', description: 'Atualize seu CPF no perfil.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: {
          action: 'create-pix',
          name: profile.name,
          cpfCnpj: profile.cpf.replace(/\D/g, ''),
          phone: profile.phone?.replace(/\D/g, '') || '',
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setPaymentResult(data);
      toast({ title: 'PIX gerado!', description: 'Escaneie o QR Code ou copie o código.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível gerar o PIX.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.cpf) {
      toast({ title: 'CPF necessário', description: 'Atualize seu CPF no perfil.', variant: 'destructive' });
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
          name: profile.name,
          cpfCnpj: profile.cpf.replace(/\D/g, ''),
          email: holderInfo.email,
          phone: holderInfo.phone?.replace(/\D/g, '') || profile.phone?.replace(/\D/g, '') || '',
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
            phone: holderInfo.phone?.replace(/\D/g, '') || profile.phone?.replace(/\D/g, '') || '',
          },
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      setPaymentResult(data);
      toast({ title: '🎉 Pagamento aprovado!', description: 'Seu plano foi ativado com sucesso.' });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Não foi possível processar o cartão.';
      toast({ title: 'Erro no pagamento', description: msg, variant: 'destructive' });
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

  // If payment was already made, show result
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
      {/* Plan Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plano Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Mensalidade</p>
              <p className="text-2xl font-bold text-primary">R$ {planPrice.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Acesso completo</p>
              <p>Renovação mensal</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Gere um QR Code PIX para pagamento instantâneo</p>
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
                    `Pagar R$ ${planPrice.toFixed(2).replace('.', ',')}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Pagamento seguro processado via Asaas.
      </p>
    </div>
  );
}
