import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  Building2,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin, Appointment } from "@/hooks/useAdmin";

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
};

export function AdminAppointmentsTab() {
  const { appointments, loadingAppointments, clinics } = useAdmin();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clinicFilter, setClinicFilter] = useState<string>("all");
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  const filteredAppointments = appointments?.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (clinicFilter !== "all" && apt.clinic_id !== clinicFilter) return false;
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    const config = statusLabels[status] || { label: status, className: "bg-gray-100" };
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loadingAppointments) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={clinicFilter} onValueChange={setClinicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Clínica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as clínicas</SelectItem>
                {clinics?.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Agendamentos ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border p-4"
              >
                <button
                  onClick={() => setExpandedAppointment(
                    expandedAppointment === appointment.id ? null : appointment.id
                  )}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.profile?.name || "Usuário"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{appointment.clinic?.name || "Clínica"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment.status)}
                      {expandedAppointment === appointment.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedAppointment === appointment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4 pt-4 border-t space-y-3"
                  >
                    {/* Date and Time */}
                    {(appointment.preferred_date || appointment.preferred_time) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {appointment.preferred_date && format(
                            new Date(appointment.preferred_date), 
                            "dd/MM/yyyy", 
                            { locale: ptBR }
                          )}
                          {appointment.preferred_time && ` às ${appointment.preferred_time}`}
                        </span>
                      </div>
                    )}

                    {/* Exams */}
                    {appointment.appointment_exams && appointment.appointment_exams.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Exames:</p>
                        <div className="flex flex-wrap gap-1">
                          {appointment.appointment_exams.map((ae, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ae.exam_type?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {appointment.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Observações:</p>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Created At */}
                    <p className="text-xs text-muted-foreground">
                      Criado em: {format(
                        new Date(appointment.created_at), 
                        "dd/MM/yyyy 'às' HH:mm", 
                        { locale: ptBR }
                      )}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
