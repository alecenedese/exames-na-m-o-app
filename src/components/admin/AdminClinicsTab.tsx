import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Building2, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Phone,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin, ClinicRegistration } from "@/hooks/useAdmin";

export function AdminClinicsTab() {
  const { 
    pendingClinics, 
    loadingPending, 
    clinics,
    loadingClinics,
    approveClinic, 
    rejectClinic 
  } = useAdmin();
  
  const [selectedRegistration, setSelectedRegistration] = useState<ClinicRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);

  const pendingList = pendingClinics?.filter(c => c.status === 'pending') || [];

  const handleApprove = (registration: ClinicRegistration) => {
    approveClinic.mutate(registration);
  };

  const handleReject = () => {
    if (selectedRegistration && rejectReason) {
      rejectClinic.mutate({ id: selectedRegistration.id, reason: rejectReason });
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedRegistration(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium text-xs">Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium text-xs">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-medium text-xs">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingPending || loadingClinics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Registrations */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <span className="font-bold text-sm">Cadastros Pendentes ({pendingList.length})</span>
        </div>
        
        {pendingList.length === 0 ? (
          <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhum cadastro pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((registration, index) => (
              <motion.div
                key={registration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-2xl border shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{registration.clinic_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        CNPJ: {registration.cnpj}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(registration.status)}
                </div>
                
                <div className="space-y-2 text-sm bg-muted/30 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{registration.address}, {registration.city}-{registration.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>WhatsApp: {registration.whatsapp}</span>
                  </div>
                  {registration.opening_hours && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{registration.opening_hours}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Cadastrado em: {format(new Date(registration.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(registration)}
                    disabled={approveClinic.isPending}
                    className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                  >
                    {approveClinic.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setShowRejectDialog(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Active Clinics */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-sm">Clínicas Ativas ({clinics?.length || 0})</span>
        </div>
        
        {!clinics || clinics.length === 0 ? (
          <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma clínica cadastrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map((clinic, index) => (
              <motion.div
                key={clinic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-2xl border shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm">{clinic.name}</h4>
                      <p className="text-xs text-muted-foreground">{clinic.city}-{clinic.state}</p>
                    </div>
                  </div>
                  {expandedClinic === clinic.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedClinic === clinic.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t">
                        <div className="bg-muted/30 rounded-xl p-3 mt-3 space-y-2 text-sm">
                          <p><strong>Endereço:</strong> {clinic.address}</p>
                          <p><strong>WhatsApp:</strong> {clinic.whatsapp}</p>
                          {clinic.phone && <p><strong>Telefone:</strong> {clinic.phone}</p>}
                          {clinic.opening_hours && <p><strong>Horário:</strong> {clinic.opening_hours}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedRegistration?.clinic_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-medium">Motivo da rejeição</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Documentação incompleta..."
              className="mt-2 h-12 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason || rejectClinic.isPending}
              className="rounded-xl"
            >
              {rejectClinic.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Rejeição"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
