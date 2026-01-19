import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, ClipboardList, MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  const categories = [
    {
      title: "Exames",
      description: "Admissional, demissional, toxicológico e mais",
      icon: ClipboardList,
      color: "bg-primary",
      href: "/exames?categoria=exame",
    },
    {
      title: "Consultas",
      description: "Clínico geral, oftalmologista, psicólogo",
      icon: Stethoscope,
      color: "bg-secondary",
      href: "/exames?categoria=consulta",
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: "Clínicas Próximas",
      description: "Encontre as clínicas mais perto de você",
    },
    {
      icon: Clock,
      title: "Agendamento Rápido",
      description: "Agende em poucos minutos",
    },
    {
      icon: Phone,
      title: "Via WhatsApp",
      description: "Confirmação direta com a clínica",
    },
  ];

  return (
    <>
      <MobileLayout showHeader={false}>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-primary px-4 pb-8 pt-12 text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <h1 className="mb-2 text-3xl font-bold">
                Exames na Mão
              </h1>
              <p className="mb-6 text-primary-foreground/80">
                Agende exames e consultas ocupacionais em Ipatinga-MG
              </p>

              {!user ? (
                <div className="flex gap-3">
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to="/auth">Entrar</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-white/50 bg-white/10 text-white hover:bg-white/20">
                    <Link to="/auth?modo=cadastro">Cadastrar</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/exames">
                    Agendar Agora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </motion.div>

            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10" />
            <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-primary-foreground/5" />
          </div>

          {/* Categories */}
          <div className="px-4 py-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              O que você precisa?
            </h2>
            <div className="grid gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={category.href}>
                    <Card className="overflow-hidden transition-all hover:shadow-md active:scale-[0.98]">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}>
                          <category.icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {category.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="px-4 pb-24">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Como funciona
            </h2>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </MobileLayout>
      <BottomNav />
    </>
  );
};

export default Index;