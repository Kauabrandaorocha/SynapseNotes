import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trophy } from 'lucide-react';

interface TaskConfettiProps {
  triggerKey: number;
  taskCount?: number;
}

/**
 * Função de compatibilidade mantida sem disparar partículas de confetes
 * para manter a interface limpa e sem poluição visual, exibindo apenas o pop-up de sucesso.
 */
export function fireTaskConfetti(_taskCount: number = 1) {
  // Partículas desativadas conforme preferência do usuário (sem poluição visual)
}

export function TaskConfetti({ triggerKey, taskCount = 1 }: TaskConfettiProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (triggerKey > 0) {
      // Exibe exclusivamente o banner/pop-up de confirmação com Framer Motion
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 2600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [triggerKey, taskCount]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 pointer-events-none z-[999998] flex items-start justify-center pt-20 sm:pt-24 px-4 overflow-hidden"
    >
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -30, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="bg-stone-900/95 dark:bg-stone-900/95 text-white border-2 border-emerald-500/60 shadow-[0_12px_45px_rgba(16,185,129,0.35)] rounded-full px-5 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              {taskCount > 1 ? (
                <Trophy className="h-4 w-4 text-amber-400 animate-bounce" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-bounce" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-emerald-400">
                {taskCount === 1 ? 'Tarefa Concluída!' : `${taskCount} Tarefas Concluídas!`}
              </span>
              <span className="text-xs text-stone-300 font-medium">Bom trabalho!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
