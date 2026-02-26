import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock,
  Save,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicAdmin } from "@/hooks/useClinicAdmin";
import { OpeningHoursSelector, OpeningHoursState, formatOpeningHoursToString } from "@/components/OpeningHoursSelector";
import { maskPhone, maskCNPJ } from "@/lib/masks";

export function ClinicProfileTab() {
  const { clinic, registration, loadingClinic, loadingRegistration, updateClinic, updateRegistration } = useClinicAdmin();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    cnpj: "",
  });

  const [openingHours, setOpeningHours] = useState<OpeningHoursState>({
    weekdays: { enabled: false, allDay: false, hasBreak: false, openTime: "08:00", closeTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    saturday: { enabled: false, allDay: false, hasBreak: false, openTime: "08:00", closeTime: "12:00", breakStart: "12:00", breakEnd: "13:00" },
    sunday: { enabled: false, allDay: false, hasBreak: false, openTime: "08:00", closeTime: "12:00", breakStart: "12:00", breakEnd: "13:00" },
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        address: clinic.address || "",
        city: clinic.city || "",
        state: clinic.state || "",
        phone: clinic.phone || "",
        whatsapp: clinic.whatsapp || "",
        cnpj: registration?.cnpj || "",
      });
    }
  }, [clinic, registration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const openingHoursString = formatOpeningHoursToString(openingHours);
    
    const { cnpj, ...clinicData } = formData;
    
    updateClinic.mutate({
      ...clinicData,
      opening_hours: openingHoursString || clinic?.opening_hours,
    });

    // Save CNPJ to registration if changed
    if (registration && cnpj !== registration.cnpj) {
      updateRegistration.mutate({ cnpj });
    }
  };

  if (loadingClinic || loadingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold text-sm">Dados da Clínica</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome da Clínica</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 rounded-xl bg-muted/50 border-0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="h-12 rounded-xl bg-muted/50 border-0"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>
      </motion.div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold text-sm">Endereço</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">Endereço Completo</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-12 rounded-xl bg-muted/50 border-0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-12 rounded-xl bg-muted/50 border-0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="h-12 rounded-xl bg-muted/50 border-0"
                maxLength={2}
                required
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold text-sm">Contato</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
              className="h-12 rounded-xl bg-muted/50 border-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
              className="h-12 rounded-xl bg-muted/50 border-0"
              required
            />
          </div>
        </div>
      </motion.div>

      {/* Opening Hours */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold text-sm">Horário de Funcionamento</h3>
        </div>
        <div className="p-4">
          {clinic?.opening_hours && (
            <div className="mb-4 p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Horário atual:</p>
              <p className="text-sm font-medium mt-1">{clinic.opening_hours}</p>
            </div>
          )}
          <OpeningHoursSelector value={openingHours} onChange={setOpeningHours} />
        </div>
      </motion.div>

      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/25"
        disabled={updateClinic.isPending}
      >
        {updateClinic.isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Save className="mr-2 h-5 w-5" />
        )}
        Salvar Alterações
      </Button>
    </form>
  );
}
