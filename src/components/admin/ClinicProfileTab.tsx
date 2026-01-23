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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicAdmin } from "@/hooks/useClinicAdmin";
import { OpeningHoursSelector, OpeningHoursState, formatOpeningHoursToString } from "@/components/OpeningHoursSelector";

export function ClinicProfileTab() {
  const { clinic, registration, loadingClinic, loadingRegistration, updateClinic } = useClinicAdmin();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
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
      });
    }
  }, [clinic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const openingHoursString = formatOpeningHoursToString(openingHours);
    
    updateClinic.mutate({
      ...formData,
      opening_hours: openingHoursString || clinic?.opening_hours,
    });
  };

  if (loadingClinic || loadingRegistration) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Dados da Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Clínica</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {registration?.cnpj && (
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{registration.cnpj}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinic?.opening_hours && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Horário atual:</p>
                <p className="text-sm font-medium">{clinic.opening_hours}</p>
              </div>
            )}
            <OpeningHoursSelector value={openingHours} onChange={setOpeningHours} />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={updateClinic.isPending}
        >
          {updateClinic.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
}
