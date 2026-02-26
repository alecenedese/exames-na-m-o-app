import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  ClipboardList, 
  DollarSign, 
  Calendar,
  Loader2,
  Shield,
  Home,
  Settings,
  ChevronLeft,
  CreditCard,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";

import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useClinicStatus } from "@/hooks/useClinicStatus";
import { useClinicSubscription } from "@/hooks/useClinicSubscription";
import { AdminClinicsTab } from "@/components/admin/AdminClinicsTab";
import { AdminExamsTab } from "@/components/admin/AdminExamsTab";
import { AdminPricesTab } from "@/components/admin/AdminPricesTab";
import { AdminAppointmentsTab } from "@/components/admin/AdminAppointmentsTab";
import { ClinicProfileTab } from "@/components/admin/ClinicProfileTab";
import { ClinicPricesTab } from "@/components/admin/ClinicPricesTab";
import { ClinicAppointmentsTab } from "@/components/admin/ClinicAppointmentsTab";
import { ClinicPaymentTab } from "@/components/admin/ClinicPaymentTab";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, checkingAdmin } = useAdmin();
  const { isClinicOwner, loading: clinicLoading } = useClinicStatus();
  const { isPaid, daysRemaining, loading: subLoading, refetch: refetchSubscription } = useClinicSubscription();
  
  const [activeTab, setActiveTab] = useState("payment");
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    if (!checkingAdmin && !clinicLoading && !subLoading) {
      if (isSuperAdmin) {
        setActiveTab("clinics");
      } else if (!isPaid) {
        setActiveTab("payment");
      } else {
        setActiveTab("profile");
      }
    }
  }, [isSuperAdmin, checkingAdmin, clinicLoading, subLoading, isPaid]);

  if (authLoading || checkingAdmin || clinicLoading || subLoading) {
    return (
      <MobileLayout showHeader={false}>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
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
      <MobileLayout showHeader={false}>
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center bg-background">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
            <Shield className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Acesso Restrito</h1>
          <p className="text-muted-foreground text-sm">
            Você não tem permissão para acessar esta página.
          </p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/">Voltar para Home</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // Tabs for super admin (all tabs)
  const superAdminTabs = [
    { id: "clinics", label: "Clínicas", icon: Building2 },
    { id: "exams", label: "Exames", icon: ClipboardList },
    { id: "prices", label: "Preços", icon: DollarSign },
    { id: "appointments", label: "Agenda", icon: Calendar },
  ];

  // Tabs for clinic owners
  const clinicTabs = [
    { id: "payment", label: "Pagamento", icon: CreditCard },
    { id: "profile", label: "Clínica", icon: Settings, locked: !isPaid },
    { id: "prices", label: "Preços", icon: DollarSign, locked: !isPaid },
    { id: "appointments", label: "Agenda", icon: Calendar, locked: !isPaid },
  ];

  const tabs = isSuperAdmin ? superAdminTabs : clinicTabs;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && 'locked' in tab && tab.locked) return;
    setShowEditProfile(false);
    setActiveTab(tabId);
  };

  const renderContent = () => {
    if (isSuperAdmin) {
      switch (activeTab) {
        case "clinics": return <AdminClinicsTab />;
        case "exams": return <AdminExamsTab />;
        case "prices": return <AdminPricesTab />;
        case "appointments": return <AdminAppointmentsTab />;
        default: return null;
      }
    } else {
      // If showing edit profile from payment error
      if (showEditProfile) {
        return <ClinicProfileTab />;
      }
      switch (activeTab) {
        case "payment": return (
          <ClinicPaymentTab
            onPaymentConfirmed={refetchSubscription}
            onEditProfile={() => setShowEditProfile(true)}
          />
        );
        case "profile": return <ClinicProfileTab />;
        case "prices": return <ClinicPricesTab />;
        case "appointments": return <ClinicAppointmentsTab />;
        default: return null;
      }
    }
  };

  return (
    <MobileLayout showHeader={false}>
      <div className="min-h-screen bg-background">
        {/* Subscription info banner */}
        {!isSuperAdmin && isPaid && daysRemaining <= 30 && (
          <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium safe-area-top">
            Sua assinatura expira em {daysRemaining} dias
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 pt-12 pb-6 safe-area-top">
          <div className="flex items-center justify-between">
            <Link to="/" className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            {showEditProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setShowEditProfile(false)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar ao pagamento
              </Button>
            )}
            {!showEditProfile && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Link to="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {isSuperAdmin ? "Painel Admin" : showEditProfile ? "Editar Dados" : "Minha Clínica"}
                </h1>
                <p className="text-sm text-slate-300">
                  {isSuperAdmin 
                    ? "Gerencie clínicas e exames" 
                    : showEditProfile
                      ? "Corrija seus dados de cadastro"
                      : isPaid ? "Gerencie preços e agendamentos" : "Ative seu plano para começar"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs - hide when editing profile from payment */}
        {!showEditProfile && (
          <div className="px-4 -mt-3">
            <div className="bg-card rounded-2xl shadow-lg border p-1.5 flex gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isLocked = 'locked' in tab && tab.locked;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all relative",
                      isActive 
                        ? "bg-primary text-white shadow-md" 
                        : isLocked
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <tab.icon className="h-5 w-5" />
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <motion.div 
          key={showEditProfile ? 'edit-profile' : activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-6 pb-24"
        >
          {renderContent()}
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default Admin;
