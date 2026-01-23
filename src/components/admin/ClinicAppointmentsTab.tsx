import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluído", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
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
    const config = statusLabels[status] || { label: status, className: "bg-gray-100" };
    return (
      <Badge variant="secondary" className={config.className}>
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
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Meus Agendamentos ({filteredAppointments.length})
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
                          {appointment.profile?.name || "Paciente"}
                        </span>
                      </div>
                      {appointment.preferred_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.preferred_date), "dd/MM/yyyy", { locale: ptBR })}
                            {appointment.preferred_time && ` às ${appointment.preferred_time}`}
                          </span>
                        </div>
                      )}
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
                    className="mt-4 pt-4 border-t space-y-4"
                  >
                    {/* Contact */}
                    {appointment.profile?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.profile.phone}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto"
                          onClick={() => handleWhatsApp(appointment.profile?.phone, appointment.profile?.name || 'Paciente')}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    )}

                    {/* Exams */}
                    {appointment.appointment_exams && appointment.appointment_exams.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Exames solicitados:</p>
                        <div className="space-y-1">
                          {appointment.appointment_exams.map((ae, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{ae.exam_type?.name}</span>
                              {ae.price_at_booking && (
                                <span className="text-muted-foreground">
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
                      <div>
                        <p className="text-sm font-medium mb-1">Observações:</p>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
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
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
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
                        className="w-full"
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
                    <p className="text-xs text-muted-foreground">
                      Agendado em: {format(
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
