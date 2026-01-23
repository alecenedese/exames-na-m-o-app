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
    <div className="rounded-md border -mx-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs px-2">Nome</TableHead>
            <TableHead className="text-center text-xs px-1 w-16">Preço</TableHead>
            <TableHead className="text-center text-xs px-1 w-14">Pedido</TableHead>
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
                  <TableCell className="font-medium py-2 px-2">
                    <span className="text-xs">{exam.name}</span>
                  </TableCell>
                  <TableCell className="text-center py-2 px-1">
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
                        className="w-16 h-7 text-xs text-center px-1"
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
                    ) : (
                      <span 
                        className="cursor-pointer"
                        onClick={() => setEditingPrice({ 
                          examId: exam.id, 
                          price: priceData?.price?.toString() || "" 
                        })}
                      >
                        {priceData?.price 
                          ? <span className="text-xs font-medium">{formatPriceBR(priceData.price)}</span>
                          : <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Definir</span>
                        }
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-2 px-1">
                    <Select
                      value={requiresPrescription ? "sim" : "nao"}
                      onValueChange={(value) => {
                        if (priceData) {
                          setPrescription(exam.id, priceData.price, value === "sim");
                        }
                      }}
                      disabled={setExamPrice.isPending || !priceData}
                    >
                      <SelectTrigger className="w-12 h-7 text-[10px] px-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="nao" className="text-xs">Não</SelectItem>
                        <SelectItem value="sim" className="text-xs">Sim</SelectItem>
                      </SelectContent>
                    </Select>
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
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 px-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Meus Preços
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Defina preços e pedido médico
            </p>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Tabs defaultValue="exames" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 h-9">
                <TabsTrigger value="exames" className="flex items-center gap-1 text-xs">
                  <ClipboardList className="h-3 w-3" />
                  Exames ({exams.length})
                </TabsTrigger>
                <TabsTrigger value="consultas" className="flex items-center gap-1 text-xs">
                  <Stethoscope className="h-3 w-3" />
                  Consultas ({consultas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exames" className="space-y-3 mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exame..."
                    value={searchExams}
                    onChange={(e) => setSearchExams(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                {renderTable(filteredExams)}
              </TabsContent>

              <TabsContent value="consultas" className="space-y-3 mt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar consulta..."
                    value={searchConsultas}
                    onChange={(e) => setSearchConsultas(e.target.value)}
                    className="pl-8 h-8 text-sm"
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
