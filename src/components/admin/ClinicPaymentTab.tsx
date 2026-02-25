import { useState } from 'react';
import { QrCode, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  payment: { id: string; value: number; status: string; invoiceUrl: string; dueDate: string };
  pix: { qrCodeImage: string; qrCodePayload: string; expirationDate: string } | null;
}

export function ClinicPaymentTab() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const planPrice = 99.90;

  const handleGeneratePix = async () => {
    if (!profile) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }
    if (!profile.cpf) {
      toast({ title: 'CPF necessário', description: 'Atualize seu CPF na aba de perfil antes de gerar o pagamento.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: {
          action: 'create-payment',
          name: profile.name,
          cpfCnpj: profile.cpf.replace(/\D/g, ''),
          phone: profile.phone?.replace(/\D/g, '') || '',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao gerar pagamento');

      setPaymentData(data);
      toast({ title: 'PIX gerado!', description: 'Escaneie o QR Code ou copie o código.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível gerar o pagamento.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!paymentData?.pix?.qrCodePayload) return;
    navigator.clipboard.writeText(paymentData.pix.qrCodePayload);
    setCopied(true);
    toast({ title: 'Código copiado!', description: 'Cole no seu aplicativo de pagamento.' });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCheckStatus = async () => {
    if (!paymentData?.payment?.id) return;
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment', {
        body: { action: 'check-status', paymentId: paymentData.payment.id },
      });
      if (error) throw error;

      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        toast({ title: '🎉 Pagamento confirmado!', description: 'Seu plano foi ativado com sucesso.' });
      } else if (data.status === 'PENDING') {
        toast({ title: 'Aguardando pagamento', description: 'Ainda não identificamos o pagamento.' });
      } else {
        toast({ title: `Status: ${data.status}`, description: 'Verifique o status do seu pagamento.' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível verificar o status.', variant: 'destructive' });
    } finally {
      setCheckingStatus(false);
    }
  };

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
              <p className="text-2xl font-bold text-primary">
                R$ {planPrice.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Acesso completo</p>
              <p>Renovação mensal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIX Payment */}
      {!paymentData ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Pague via PIX</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gere um QR Code PIX para pagamento instantâneo
                </p>
              </div>
              <Button onClick={handleGeneratePix} disabled={loading} className="w-full h-12">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar QR Code PIX
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {paymentData.pix?.qrCodeImage && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${paymentData.pix.qrCodeImage}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
            )}

            {paymentData.pix?.qrCodePayload && (
              <div className="space-y-2">
                <Label>Código PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentData.pix.qrCodePayload}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyPix}>
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {paymentData.payment.invoiceUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={paymentData.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver fatura completa
                </a>
              </Button>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Já paguei - Verificar pagamento'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, seu plano será ativado automaticamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
