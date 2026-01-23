import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, QrCode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copied, setCopied] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const { toast } = useToast();

  const planPrice = 99.90;
  const pixCode = 'EXAMENAMAO2024PAGAMENTOMENSAL';

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3')
      .replace(/(\d{4}) (\d{4}) (\d{4})(\d)/, '$1 $2 $3 $4')
      .slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 5);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: 'Código copiado!',
      description: 'Cole no seu aplicativo de pagamento',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Pagamento processado!',
      description: 'Seu plano foi ativado com sucesso.',
    });
  };

  return (
    <div className="mobile-container bg-background min-h-screen">
      <header className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Pagamento</h1>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6"
      >
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
                <p>Renovação automática</p>
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

          <TabsContent value="pix" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    <QrCode className="w-24 h-24 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Código PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={pixCode} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyPix}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Após o pagamento, seu plano será ativado automaticamente em até 5 minutos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="card" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do cartão</Label>
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={cardData.number}
                      onChange={(e) => setCardData(prev => ({ 
                        ...prev, 
                        number: formatCardNumber(e.target.value) 
                      }))}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nome no cartão</Label>
                    <Input
                      id="cardName"
                      placeholder="Como está no cartão"
                      value={cardData.name}
                      onChange={(e) => setCardData(prev => ({ 
                        ...prev, 
                        name: e.target.value.toUpperCase() 
                      }))}
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Validade</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/AA"
                        value={cardData.expiry}
                        onChange={(e) => setCardData(prev => ({ 
                          ...prev, 
                          expiry: formatExpiry(e.target.value) 
                        }))}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="000"
                        value={cardData.cvv}
                        onChange={(e) => setCardData(prev => ({ 
                          ...prev, 
                          cvv: e.target.value.replace(/\D/g, '').slice(0, 4) 
                        }))}
                        className="h-12"
                        type="password"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 font-semibold">
                    Pagar R$ {planPrice.toFixed(2).replace('.', ',')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Pagamento seguro. Seus dados estão protegidos.
        </p>
      </motion.div>
    </div>
  );
}
