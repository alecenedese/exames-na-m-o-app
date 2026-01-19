import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  ClipboardList, 
  DollarSign, 
  Calendar,
  Loader2,
  Shield,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminClinicsTab } from "@/components/admin/AdminClinicsTab";
import { AdminExamsTab } from "@/components/admin/AdminExamsTab";
import { AdminPricesTab } from "@/components/admin/AdminPricesTab";
import { AdminAppointmentsTab } from "@/components/admin/AdminAppointmentsTab";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, checkingAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState("clinics");

  if (authLoading || checkingAdmin) {
    return (
      <MobileLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
    return (
      <MobileLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </MobileLayout>
    );
  }

  const tabs = [
    { id: "clinics", label: "Clínicas", icon: Building2 },
    { id: "exams", label: "Exames", icon: ClipboardList },
    { id: "prices", label: "Preços", icon: DollarSign },
    { id: "appointments", label: "Agendamentos", icon: Calendar },
  ];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-6">
        {/* Header */}
        <div className="bg-primary px-4 pb-6 pt-8 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Painel Admin</h1>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20"
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
            <p className="mt-1 text-primary-foreground/80">
              Gerencie clínicas, exames e agendamentos
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="px-4 -mt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-card shadow-sm">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col gap-1 py-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="clinics" className="mt-4">
              <AdminClinicsTab />
            </TabsContent>

            <TabsContent value="exams" className="mt-4">
              <AdminExamsTab />
            </TabsContent>

            <TabsContent value="prices" className="mt-4">
              <AdminPricesTab />
            </TabsContent>

            <TabsContent value="appointments" className="mt-4">
              <AdminAppointmentsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Admin;
