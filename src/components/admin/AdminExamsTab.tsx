import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ClipboardList,
  Stethoscope,
  Loader2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin, ExamType } from "@/hooks/useAdmin";

interface ExamFormData {
  name: string;
  description: string;
  category: string;
  icon: string;
}

const defaultFormData: ExamFormData = {
  name: "",
  description: "",
  category: "exame",
  icon: "clipboard-check",
};

const iconOptions = [
  { value: "clipboard-check", label: "Clipboard Check" },
  { value: "clipboard-x", label: "Clipboard X" },
  { value: "stethoscope", label: "Estetoscópio" },
  { value: "heart", label: "Coração" },
  { value: "eye", label: "Olho" },
  { value: "brain", label: "Cérebro" },
  { value: "activity", label: "Atividade" },
  { value: "droplet", label: "Gota" },
  { value: "scan", label: "Scan" },
  { value: "ear", label: "Ouvido" },
  { value: "wind", label: "Vento" },
  { value: "flask", label: "Frasco" },
  { value: "shield", label: "Escudo" },
];

export function AdminExamsTab() {
  const { 
    examTypes, 
    loadingExamTypes, 
    createExamType,
    updateExamType,
    deleteExamType 
  } = useAdmin();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamType | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamType | null>(null);
  const [formData, setFormData] = useState<ExamFormData>(defaultFormData);

  const exams = examTypes?.filter(e => e.category === 'exame') || [];
  const consultas = examTypes?.filter(e => e.category === 'consulta') || [];

  const openCreateDialog = () => {
    setEditingExam(null);
    setFormData(defaultFormData);
    setShowFormDialog(true);
  };

  const openEditDialog = (exam: ExamType) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || "",
      category: exam.category,
      icon: exam.icon || "clipboard-check",
    });
    setShowFormDialog(true);
  };

  const handleSubmit = () => {
    if (editingExam) {
      updateExamType.mutate({
        id: editingExam.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        icon: formData.icon,
      });
    } else {
      createExamType.mutate({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        icon: formData.icon,
      });
    }
    setShowFormDialog(false);
    setFormData(defaultFormData);
  };

  const handleDelete = () => {
    if (deletingExam) {
      deleteExamType.mutate(deletingExam.id);
      setShowDeleteDialog(false);
      setDeletingExam(null);
    }
  };

  if (loadingExamTypes) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderExamList = (items: ExamType[], title: string, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title} ({items.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum item cadastrado
          </p>
        ) : (
          items.map((exam) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <h4 className="font-medium">{exam.name}</h4>
                {exam.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {exam.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(exam)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeletingExam(exam);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Button onClick={openCreateDialog} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Exame/Consulta
      </Button>

      {renderExamList(exams, "Exames", <ClipboardList className="h-5 w-5 text-primary" />)}
      {renderExamList(consultas, "Consultas", <Stethoscope className="h-5 w-5 text-secondary" />)}

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExam ? "Editar" : "Novo"} Exame/Consulta
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do exame ou consulta
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Hemograma Completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do exame..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || createExamType.isPending || updateExamType.isPending}
            >
              {(createExamType.isPending || updateExamType.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingExam?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExamType.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
