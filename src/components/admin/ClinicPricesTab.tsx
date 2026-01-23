import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Loader2,
  Search,
  Stethoscope,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  const handleSavePrice = (examId: string, price: string, requiresPrescription: boolean = false) => {
    if (price) {
      setExamPrice.mutate({
        exam_type_id: examId,
        price: parseFloat(price.replace(',', '.')),
        is_available: true, // If price is set, it's available
        requires_prescription: requiresPrescription,
      });
      setEditingPrice(null);
    }
  };

  const setPrescription = (examId: string, currentPrice: number, requiresPrescription: boolean) => {
    setExamPrice.mutate({
      exam_type_id: examId,
      price: currentPrice,
      is_available: true,
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

  const renderTable = (items: typeof exams) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Nome</TableHead>
            <TableHead className="text-center w-[25%]">Preço (R$)</TableHead>
            <TableHead className="text-center w-[25%]">Pedido Médico</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
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
                  <TableCell className="font-medium py-3">
                    <span className="text-sm">{exam.name}</span>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-center">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPrice.price}
                          onChange={(e) => setEditingPrice({ 
                            examId: exam.id, 
                            price: e.target.value 
                          })}
                          className="w-20 h-8 text-sm text-center"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSavePrice(exam.id, editingPrice.price, requiresPrescription);
                            } else if (e.key === 'Escape') {
                              setEditingPrice(null);
                            }
                          }}
                          onBlur={() => {
                            if (editingPrice.price) {
                              handleSavePrice(exam.id, editingPrice.price, requiresPrescription);
                            } else {
                              setEditingPrice(null);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <span 
                        className="cursor-pointer"
                        onClick={() => setEditingPrice({ 
                          examId: exam.id, 
                          price: priceData?.price?.toString() || "" 
                        })}
                      >
                        {priceData?.price 
                          ? <span className="text-sm font-medium">{formatPriceBR(priceData.price)}</span>
                          : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">Definir</span>
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {priceData ? (
                      <Select
                        value={requiresPrescription ? "sim" : "nao"}
                        onValueChange={(value) => setPrescription(
                          exam.id, 
                          priceData.price, 
                          value === "sim"
                        )}
                        disabled={setExamPrice.isPending}
                      >
                        <SelectTrigger className="w-16 h-8 text-xs mx-auto">
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
                {renderTable(filteredExams)}
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
                {renderTable(filteredConsultas)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
