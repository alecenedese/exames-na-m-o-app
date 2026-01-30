import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Loader2,
  Search,
  Stethoscope,
  ClipboardList
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

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
  const [activeCategory, setActiveCategory] = useState<'exames' | 'consultas'>('exames');
  const [searchQuery, setSearchQuery] = useState("");

  const exams = examTypes?.filter(e => e.category === 'exame') || [];
  const consultas = examTypes?.filter(e => e.category === 'consulta') || [];

  const currentItems = activeCategory === 'exames' ? exams : consultas;
  const filteredItems = currentItems.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExamPrice = (examId: string) => {
    return clinicPrices?.find(p => p.exam_type_id === examId);
  };

  const handleSavePrice = (examId: string, price: string, requiresPrescription: boolean = false) => {
    if (price) {
      setExamPrice.mutate({
        exam_type_id: examId,
        price: parseFloat(price.replace(',', '.')),
        is_available: true,
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
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Clínica não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Meus Preços</h3>
          <p className="text-xs text-muted-foreground">Defina preços e pedido médico</p>
        </div>
      </motion.div>

      {/* Category Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1 bg-muted rounded-xl"
      >
        <button
          onClick={() => { setActiveCategory('exames'); setSearchQuery(''); }}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
            activeCategory === 'exames' 
              ? "bg-white text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Exames ({exams.length})
        </button>
        <button
          onClick={() => { setActiveCategory('consultas'); setSearchQuery(''); }}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
            activeCategory === 'consultas' 
              ? "bg-white text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Stethoscope className="w-4 h-4" />
          Consultas ({consultas.length})
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Buscar ${activeCategory === 'exames' ? 'exames' : 'consultas'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-card border shadow-sm"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold px-4">Nome</TableHead>
              <TableHead className="text-center text-xs font-semibold px-2 w-20">Preço</TableHead>
              <TableHead className="text-center text-xs font-semibold px-2 w-16">Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((exam) => {
                const priceData = getExamPrice(exam.id);
                const isEditing = editingPrice?.examId === exam.id;
                const requiresPrescription = (priceData as any)?.requires_prescription ?? false;
                
                return (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium py-3 px-4">
                      <span className="text-sm">{exam.name}</span>
                    </TableCell>
                    <TableCell className="text-center py-3 px-2">
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
                          className="w-20 h-9 text-sm text-center rounded-lg"
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
                            ? <span className="text-sm font-semibold">{formatPriceBR(priceData.price)}</span>
                            : <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg text-xs font-semibold">Definir</span>
                          }
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-3 px-2">
                      <Select
                        value={requiresPrescription ? "sim" : "nao"}
                        onValueChange={(value) => {
                          if (priceData) {
                            setPrescription(exam.id, priceData.price, value === "sim");
                          }
                        }}
                        disabled={setExamPrice.isPending || !priceData}
                      >
                        <SelectTrigger className="w-14 h-9 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
      </motion.div>
    </div>
  );
}
