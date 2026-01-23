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
import { TrialBanner } from "@/components/TrialBanner";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useClinicStatus } from "@/hooks/useClinicStatus";
import { AdminClinicsTab } from "@/components/admin/AdminClinicsTab";
import { AdminExamsTab } from "@/components/admin/AdminExamsTab";
import { AdminPricesTab } from "@/components/admin/AdminPricesTab";
import { AdminAppointmentsTab } from "@/components/admin/AdminAppointmentsTab";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, checkingAdmin } = useAdmin();
  const { isClinicOwner, isTrialPeriod, daysRemaining, loading: clinicLoading } = useClinicStatus();
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "clinics" : "prices");

  if (authLoading || checkingAdmin || clinicLoading) {
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

  const hasAccess = isSuperAdmin || isClinicOwner;

  if (!hasAccess) {
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

  // Tabs for super admin (all tabs)
  const superAdminTabs = [
    { id: "clinics", label: "Clínicas", icon: Building2 },
    { id: "exams", label: "Exames", icon: ClipboardList },
    { id: "prices", label: "Preços", icon: DollarSign },
    { id: "appointments", label: "Agendamentos", icon: Calendar },
  ];

  // Tabs for clinic owners (limited)
  const clinicTabs = [
    { id: "prices", label: "Meus Preços", icon: DollarSign },
    { id: "appointments", label: "Agendamentos", icon: Calendar },
  ];

  const tabs = isSuperAdmin ? superAdminTabs : clinicTabs;
  const defaultTab = isSuperAdmin ? "clinics" : "prices";

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-6">
        {/* Trial Banner for Clinic Owners */}
        {isClinicOwner && isTrialPeriod && (
          <TrialBanner daysRemaining={daysRemaining} />
        )}

        {/* Header */}
        <div className="bg-primary px-4 pb-6 pt-8 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                <h1 className="text-2xl font-bold">
                  {isSuperAdmin ? "Painel Admin" : "Painel da Clínica"}
                </h1>
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
              {isSuperAdmin 
                ? "Gerencie clínicas, exames e agendamentos" 
                : "Gerencie seus preços e agendamentos"}
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="px-4 -mt-3">
          <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full bg-card shadow-sm ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
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

            {isSuperAdmin && (
              <>
                <TabsContent value="clinics" className="mt-4">
                  <AdminClinicsTab />
                </TabsContent>

                <TabsContent value="exams" className="mt-4">
                  <AdminExamsTab />
                </TabsContent>
              </>
            )}

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
