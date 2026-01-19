import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Building2,
  Loader2,
  Save,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useAdmin } from "@/hooks/useAdmin";

export function AdminPricesTab() {
  const { 
    clinics, 
    loadingClinics,
    examTypes, 
    loadingExamTypes,
    clinicPrices,
    loadingPrices,
    setClinicPrice
  } = useAdmin();

  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [editingPrice, setEditingPrice] = useState<{ examId: string; price: string } | null>(null);

  const selectedClinicData = clinics?.find(c => c.id === selectedClinic);
  const clinicExamPrices = clinicPrices?.filter(p => p.clinic_id === selectedClinic) || [];

  const getExamPrice = (examId: string) => {
    return clinicExamPrices.find(p => p.exam_type_id === examId);
  };

  const handleSavePrice = (examId: string, price: string, isAvailable: boolean = true) => {
    if (selectedClinic && price) {
      setClinicPrice.mutate({
        clinic_id: selectedClinic,
        exam_type_id: examId,
        price: parseFloat(price),
        is_available: isAvailable,
      });
      setEditingPrice(null);
    }
  };

  const toggleAvailability = (examId: string, currentPrice: number, currentAvailable: boolean) => {
    if (selectedClinic) {
      setClinicPrice.mutate({
        clinic_id: selectedClinic,
        exam_type_id: examId,
        price: currentPrice,
        is_available: !currentAvailable,
      });
    }
  };

  if (loadingClinics || loadingExamTypes || loadingPrices) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinic Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Selecionar Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma clínica..." />
            </SelectTrigger>
            <SelectContent>
              {clinics?.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Prices Table */}
      {selectedClinic && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Preços - {selectedClinicData?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exame/Consulta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço (R$)</TableHead>
                      <TableHead className="text-center">Disponível</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examTypes?.map((exam) => {
                      const priceData = getExamPrice(exam.id);
                      const isEditing = editingPrice?.examId === exam.id;
                      
                      return (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.name}</TableCell>
                          <TableCell>
                            <span className={`capitalize text-xs px-2 py-1 rounded ${
                              exam.category === 'exame' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-secondary/10 text-secondary-foreground'
                            }`}>
                              {exam.category}
                            </span>
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
                                  ? `R$ ${priceData.price.toFixed(2)}`
                                  : <span className="text-muted-foreground">Definir</span>
                                }
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {priceData ? (
                              <Switch
                                checked={priceData.is_available}
                                onCheckedChange={() => toggleAvailability(
                                  exam.id, 
                                  priceData.price, 
                                  priceData.is_available
                                )}
                                disabled={setClinicPrice.isPending}
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
                                    priceData?.is_available ?? true
                                  )}
                                  disabled={!editingPrice.price || setClinicPrice.isPending}
                                >
                                  {setClinicPrice.isPending ? (
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
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!selectedClinic && (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Selecione uma clínica para gerenciar os preços</p>
        </div>
      )}
    </div>
  );
}
