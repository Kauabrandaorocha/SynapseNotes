import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trophy } from 'lucide-react';

interface TaskConfettiProps {
  triggerKey: number;
  taskCount?: number;
  isActiveTab?: boolean;
}

/**
 * Função de compatibilidade mantida sem disparar partículas de confetes
 * para manter a interface limpa e sem poluição visual.
 */
export function fireTaskConfetti(_taskCount: number = 1) {
  // Partículas desativadas
}

export function TaskConfetti({
  triggerKey,
  taskCount = 1,
  isActiveTab = true,
}: TaskConfettiProps) {
  const [showBanner, setShowBanner] = useState(false);
  // Guarda o trigger presente no momento da montagem para NUNCA disparar ao carregar a tela
  const initialTriggerRef = useRef(triggerKey);
  const lastTriggerRef = useRef(triggerKey);

  useEffect(() => {
    // Só dispara se:
    // 1. triggerKey for maior que 0
    // 2. Não for a montagem inicial (triggerKey mudou de valor)
    // 3. triggerKey for diferente da última execução
    // 4. O usuário estiver explicitamente na tela/aba de tarefas
    if (
      triggerKey > 0 &&
      triggerKey !== initialTriggerRef.current &&
      triggerKey !== lastTriggerRef.current &&
      isActiveTab
    ) {
      lastTriggerRef.current = triggerKey;
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
    lastTriggerRef.current = triggerKey;
    return undefined;
  }, [triggerKey, taskCount, isActiveTab]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 pointer-events-none z-[999998] flex items-start justify-center pt-20 sm:pt-24 px-4 overflow-hidden"
    >
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: -15,
              transition: { duration: 0.35, ease: 'easeOut' },
            }}
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
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-white leading-none">
              {taskCount === 1 ? 'Tarefa concluída!' : `${taskCount} tarefas concluídas!`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
