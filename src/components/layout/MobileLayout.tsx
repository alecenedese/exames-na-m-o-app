import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  title?: string;
  headerAction?: ReactNode;
  className?: string;
}

export function MobileLayout({ 
  children, 
  showHeader = true, 
  title, 
  headerAction,
  className = '' 
}: MobileLayoutProps) {
  return (
    <div className={`mobile-container bg-background ${className}`}>
      {showHeader && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm safe-area-top border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <h1 className="font-display font-bold text-lg text-foreground">
              {title || 'Exames na Mão'}
            </h1>
            {headerAction}
          </div>
        </header>
      )}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </div>
  );
}
