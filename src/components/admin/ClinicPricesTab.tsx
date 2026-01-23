import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Loader2,
  Check,
  X,
  Search,
  Stethoscope,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClinicAdmin } from "@/hooks/useClinicAdmin";

// Format price to Brazilian Real format (50 -> 50,00)
const formatPriceBR = (price: number) => {
  return price.toFixed(2).replace('.', ',');
};

export function ClinicPricesTab() {
  const { 
    clinic,
    examTypes, 
    loadingExamTypes,
    clinicPrices,
    loadingPrices,
    setExamPrice
  } = useClinicAdmin();

  const [editingPrice, setEditingPrice] = useState<{ examId: string; price: string } | null>(null);
  const [searchExams, setSearchExams] = useState("");
  const [searchConsultas, setSearchConsultas] = useState("");

  const exams = examTypes?.filter(e => e.category === 'exame') || [];
  const consultas = examTypes?.filter(e => e.category === 'consulta') || [];

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(searchExams.toLowerCase())
  );

  const filteredConsultas = consultas.filter(e => 
    e.name.toLowerCase().includes(searchConsultas.toLowerCase())
  );

  const getExamPrice = (examId: string) => {
    return clinicPrices?.find(p => p.exam_type_id === examId);
  };

  const handleSavePrice = (examId: string, price: string, isAvailable: boolean = true, requiresPrescription: boolean = false) => {
    if (price) {
      setExamPrice.mutate({
        exam_type_id: examId,
        price: parseFloat(price),
        is_available: isAvailable,
        requires_prescription: requiresPrescription,
      });
      setEditingPrice(null);
    }
  };

  const toggleAvailability = (examId: string, currentPrice: number, currentAvailable: boolean, requiresPrescription: boolean) => {
    setExamPrice.mutate({
      exam_type_id: examId,
      price: currentPrice,
      is_available: !currentAvailable,
      requires_prescription: requiresPrescription,
    });
  };

  const setPrescription = (examId: string, currentPrice: number, isAvailable: boolean, requiresPrescription: boolean) => {
    setExamPrice.mutate({
      exam_type_id: examId,
      price: currentPrice,
      is_available: isAvailable,
      requires_prescription: requiresPrescription,
    });
  };

  if (loadingExamTypes || loadingPrices) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Clínica não encontrada</p>
      </div>
    );
  }

  const renderTable = (items: typeof exams, search: string) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right">Preço (R$)</TableHead>
            <TableHead className="text-center">Pedido Médico</TableHead>
            <TableHead className="text-center">Disponível</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum item encontrado
              </TableCell>
            </TableRow>
          ) : (
            items.map((exam) => {
              const priceData = getExamPrice(exam.id);
              const isEditing = editingPrice?.examId === exam.id;
              const requiresPrescription = (priceData as any)?.requires_prescription ?? false;
              
              return (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{exam.name}</span>
                      {exam.description && (
                        <p className="text-xs text-muted-foreground">{exam.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingPrice.price}
                        onChange={(e) => setEditingPrice({ 
                          examId: exam.id, 
                          price: e.target.value 
                        })}
                        className="w-24 ml-auto"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:underline"
                        onClick={() => setEditingPrice({ 
                          examId: exam.id, 
                          price: priceData?.price?.toString() || "" 
                        })}
                      >
                        {priceData?.price 
                          ? `R$ ${formatPriceBR(priceData.price)}`
                          : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Definir preço</span>
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {priceData ? (
                      <Select
                        value={requiresPrescription ? "sim" : "nao"}
                        onValueChange={(value) => setPrescription(
                          exam.id, 
                          priceData.price, 
                          priceData.is_available,
                          value === "sim"
                        )}
                        disabled={setExamPrice.isPending}
                      >
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {priceData ? (
                      <Switch
                        checked={priceData.is_available}
                        onCheckedChange={() => toggleAvailability(
                          exam.id, 
                          priceData.price, 
                          priceData.is_available,
                          requiresPrescription
                        )}
                        disabled={setExamPrice.isPending}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleSavePrice(
                            exam.id, 
                            editingPrice.price,
                            priceData?.is_available ?? true,
                            requiresPrescription
                          )}
                          disabled={!editingPrice.price || setExamPrice.isPending}
                        >
                          {setExamPrice.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingPrice(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPrice({ 
                          examId: exam.id, 
                          price: priceData?.price?.toString() || "" 
                        })}
                      >
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Meus Preços - {clinic.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Defina os preços e se precisa de pedido médico para cada serviço
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="exames" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="exames" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Exames ({exams.length})
                </TabsTrigger>
                <TabsTrigger value="consultas" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Consultas ({consultas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exames" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exame..."
                    value={searchExams}
                    onChange={(e) => setSearchExams(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {renderTable(filteredExams, searchExams)}
              </TabsContent>

              <TabsContent value="consultas" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar consulta..."
                    value={searchConsultas}
                    onChange={(e) => setSearchConsultas(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {renderTable(filteredConsultas, searchConsultas)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
