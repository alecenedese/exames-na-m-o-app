import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, ClipboardList, MapPin, Clock, MessageCircle, ChevronRight, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { TrialBanner } from "@/components/TrialBanner";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useClinicStatus } from "@/hooks/useClinicStatus";
import logoHero from "@/assets/logo-hero.png";

const Index = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useAdmin();
  const { isClinicOwner, isTrialPeriod, daysRemaining } = useClinicStatus();

  const categories = [
    {
      title: "Exames",
      subtitle: "Admissional, demissional, toxicológico",
      icon: ClipboardList,
      gradient: "from-emerald-500 to-emerald-600",
      href: "/exames?categoria=exame",
    },
    {
      title: "Consultas",
      subtitle: "Clínico geral, oftalmologista, psicólogo",
      icon: Stethoscope,
      gradient: "from-amber-500 to-orange-500",
      href: "/exames?categoria=consulta",
    },
  ];

  const steps = [
    {
      icon: Search,
      number: "1",
      title: "Escolha o exame",
      description: "Selecione o que você precisa",
    },
    {
      icon: MapPin,
      number: "2",
      title: "Veja as clínicas",
      description: "Compare preços e localização",
    },
    {
      icon: Clock,
      number: "3",
      title: "Agende rápido",
      description: "Em poucos minutos",
    },
    {
      icon: MessageCircle,
      number: "4",
      title: "Confirme no WhatsApp",
      description: "Direto com a clínica",
    },
  ];

  return (
    <>
      <MobileLayout showHeader={false}>
        <div className="min-h-screen bg-background">
          {/* Trial Banner for Clinic Owners */}
          {user && isClinicOwner && isTrialPeriod && (
            <TrialBanner daysRemaining={daysRemaining} />
          )}

          {/* Hero Section - White background */}
          <div className="relative overflow-hidden bg-white px-5 pb-6 pt-6">
            <motion.div
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={logoHero}
                alt="Exame na Mão"
                className="mb-4 w-48"
              />

              {!user ? (
                <div className="flex w-full max-w-xs gap-3">
                  <Button asChild size="lg" className="flex-1 font-semibold shadow-lg shadow-primary/25">
                    <Link to="/auth">Entrar</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="flex-1 font-semibold">
                    <Link to="/auth?modo=cadastro">Cadastrar</Link>
                  </Button>
                </div>
              ) : isClinicOwner || isSuperAdmin ? (
                <Button asChild size="lg" className="w-full max-w-xs bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25">
                  <Link to="/admin">
                    <Shield className="mr-2 h-5 w-5" />
                    Painel da Clínica
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full max-w-xs bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25">
                  <Link to="/exames">
                    Agendar Agora
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>

          {/* Categories - Large touch targets */}
          <div className="px-4 py-6">
            <h2 className="mb-4 text-base font-bold text-foreground">
              O que você precisa?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={category.href}>
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-4 shadow-lg transition-transform active:scale-[0.97]`}>
                      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                      <category.icon className="mb-3 h-8 w-8 text-white" />
                      <h3 className="text-lg font-bold text-white">
                        {category.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/80 line-clamp-2">
                        {category.subtitle}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How it works - Timeline style */}
          <div className="px-4 pb-28">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Como funciona
            </h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-2 h-[calc(100%-20px)] w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
              
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-md">
                      {step.number}
                    </div>
                    <div className="flex-1 rounded-xl bg-card p-3 shadow-sm border">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
};

export default Index;