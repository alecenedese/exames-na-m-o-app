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
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const approvedList = pendingClinics?.filter(c => c.status === 'approved') || [];
  const rejectedList = pendingClinics?.filter(c => c.status === 'rejected') || [];

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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loadingPending || loadingClinics) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Registrations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
            Cadastros Pendentes ({pendingList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingList.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum cadastro pendente
            </p>
          ) : (
            pendingList.map((registration) => (
              <motion.div
                key={registration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{registration.clinic_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {registration.cnpj}
                    </p>
                  </div>
                  {getStatusBadge(registration.status)}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{registration.address}, {registration.city}-{registration.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp: {registration.whatsapp}</span>
                    {registration.phone && <span>| Tel: {registration.phone}</span>}
                  </div>
                  {registration.opening_hours && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{registration.opening_hours}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Cadastrado em: {format(new Date(registration.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(registration)}
                    disabled={approveClinic.isPending}
                    className="flex-1"
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
                    variant="destructive"
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setShowRejectDialog(true);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active Clinics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Clínicas Ativas ({clinics?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!clinics || clinics.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma clínica cadastrada
            </p>
          ) : (
            clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="rounded-lg border p-3"
              >
                <button
                  onClick={() => setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <h4 className="font-medium">{clinic.name}</h4>
                      <p className="text-xs text-muted-foreground">{clinic.city}-{clinic.state}</p>
                    </div>
                  </div>
                  {expandedClinic === clinic.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                      <div className="pt-3 mt-3 border-t space-y-1 text-sm text-muted-foreground">
                        <p><strong>Endereço:</strong> {clinic.address}</p>
                        <p><strong>WhatsApp:</strong> {clinic.whatsapp}</p>
                        {clinic.phone && <p><strong>Telefone:</strong> {clinic.phone}</p>}
                        {clinic.opening_hours && <p><strong>Horário:</strong> {clinic.opening_hours}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Cadastro</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedRegistration?.clinic_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Motivo da rejeição</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Documentação incompleta..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason || rejectClinic.isPending}
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
