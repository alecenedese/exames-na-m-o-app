import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MessageCircle,
  CalendarDays,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinicAdmin } from "@/hooks/useClinicAdmin";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  confirmed: { label: "Confirmado", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "Concluído", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export function ClinicAppointmentsTab() {
  const { clinic, appointments, loadingAppointments, updateAppointmentStatus } = useClinicAdmin();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  const filteredAppointments = appointments?.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, className: "" };
    return (
      <Badge className={`${config.className} font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const handleWhatsApp = (phone: string | null | undefined, patientName: string) => {
    if (!phone) return;
    const message = encodeURIComponent(
      `Olá ${patientName}! Aqui é da ${clinic?.name}. Estamos entrando em contato sobre seu agendamento.`
    );
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  if (loadingAppointments) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border shadow-sm p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-sm">Filtrar por status</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-0">
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
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-sm">Agendamentos ({filteredAppointments.length})</span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-2xl border shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedAppointment(
                    expandedAppointment === appointment.id ? null : appointment.id
                  )}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-bold text-sm block">
                          {appointment.profile?.name || "Paciente"}
                        </span>
                        {appointment.preferred_date && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(appointment.preferred_date), "dd/MM/yyyy", { locale: ptBR })}
                              {appointment.preferred_time && ` às ${appointment.preferred_time}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment.status)}
                      {expandedAppointment === appointment.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedAppointment === appointment.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                        {/* Contact */}
                        {appointment.profile?.phone && (
                          <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{appointment.profile.phone}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleWhatsApp(appointment.profile?.phone, appointment.profile?.name || 'Paciente')}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                        )}

                        {/* Exams */}
                        {appointment.appointment_exams && appointment.appointment_exams.length > 0 && (
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Exames solicitados:</p>
                            <div className="space-y-1.5">
                              {appointment.appointment_exams.map((ae, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{ae.exam_type?.name}</span>
                                  {ae.price_at_booking && (
                                    <span className="font-semibold">
                                      R$ {ae.price_at_booking.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {appointment.notes && (
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
                            <p className="text-sm">{appointment.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => updateAppointmentStatus.mutate({ 
                                id: appointment.id, 
                                status: 'confirmed' 
                              })}
                              disabled={updateAppointmentStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => updateAppointmentStatus.mutate({ 
                                id: appointment.id, 
                                status: 'cancelled' 
                              })}
                              disabled={updateAppointmentStatus.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}

                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            className="w-full h-11 rounded-xl"
                            onClick={() => updateAppointmentStatus.mutate({ 
                              id: appointment.id, 
                              status: 'completed' 
                            })}
                            disabled={updateAppointmentStatus.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Concluído
                          </Button>
                        )}

                        {/* Created At */}
                        <p className="text-xs text-muted-foreground text-center">
                          Agendado em: {format(
                            new Date(appointment.created_at), 
                            "dd/MM/yyyy 'às' HH:mm", 
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
