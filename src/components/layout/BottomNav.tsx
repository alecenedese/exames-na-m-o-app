import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Search, label: 'Exames', path: '/exames' },
  { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
  { icon: User, label: 'Perfil', path: '/perfil' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 relative transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
