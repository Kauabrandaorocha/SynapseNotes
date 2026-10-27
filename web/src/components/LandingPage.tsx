import { useState } from 'react';
import {
  Mic,
  ArrowRight,
  Brain,
  CheckCircle2,
  Radio,
  Copy,
  Check,
  ShieldCheck,
  GraduationCap,
  FlaskConical,
  Code2,
  Rocket,
  Heart,
  QrCode,
  Sun,
  Moon,
  Github,
  Linkedin,
} from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface LandingPageProps {
  onEnterApp: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function LandingPage({ onEnterApp, theme, toggleTheme }: LandingPageProps) {
  const [copiedPix, setCopiedPix] = useState(false);
  const pixKey = 'pix@synapsenotes.app';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col w-full selection:bg-[var(--accent-subtle)] selection:text-[var(--accent)] font-sans antialiased overflow-x-hidden">
      {/* Indicador de Status Offline */}
      <OfflineIndicator />

      {/* ========================================================================= */}
      {/* 1. HEADER FLUTUANTE COM CANTOS ARREDONDADOS & GLASSMORPHISM */}
      {/* ========================================================================= */}
      <header className="sticky top-2 sm:top-4 z-50 px-2.5 sm:px-6 w-full flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-5xl 2xl:max-w-6xl mx-auto rounded-2xl sm:rounded-full backdrop-blur-md bg-stone-900/90 dark:bg-stone-900/90 border border-stone-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.25)] px-3 py-2 sm:px-6 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 text-white transition-all">
          {/* Logo e Nome à esquerda */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="/assets/imagemlogo/logo_synapsenotes.png"
              alt="SynapseNotes Logo"
              className="h-7 sm:h-9 w-auto max-h-9 object-contain shrink-0 drop-shadow-[0_2px_10px_rgba(249,115,22,0.35)] transition-transform hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              {/* Nome do aplicativo: sem cortes ou reticências (sem truncate) */}
              <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap leading-tight">
                SynapseNotes
              </span>
              {/* Subtítulo: oculto no mobile (< 640px), exibido no tablet/desktop (>= 768px) com cor esmaecida */}
              <span className="hidden sm:block text-[10px] sm:text-[11px] text-amber-400/80 font-medium tracking-wide whitespace-nowrap leading-tight">
                Segundo Cérebro Inteligente
              </span>
            </div>
          </div>

          {/* Links e Botões à direita */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Botão de Instalação PWA */}
            <PWAInstallButton className="hidden sm:inline-flex text-white border-stone-700 bg-stone-800/80 hover:bg-stone-700 hover:text-white" />

            {/* Alternador de Tema */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Botão Entrar: sem fundo, apenas borda e texto limpo. Oculto em telas ultra-compactas (< 420px) para evitar estouro */}
            <button
              onClick={onEnterApp}
              className="hidden min-[420px]:inline-flex border border-stone-700 hover:border-stone-500 text-stone-200 hover:text-white bg-transparent px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:bg-stone-800/40 cursor-pointer whitespace-nowrap"
            >
              Entrar
            </button>

            {/* Botão Criar Conta: sólido Laranja/Âmbar da paleta oficial com tamanho compacto no mobile */}
            <button
              onClick={onEnterApp}
              className="bg-[var(--accent)] hover:bg-[#ea580c] text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Criar Conta</span>
              <ArrowRight className="h-3.5 w-3.5 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION COM MOCKUP REAL DA APLICAÇÃO */}
      {/* ========================================================================= */}
      <section className="pt-12 sm:pt-16 pb-16 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Badge 100% Gratuito */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] text-[var(--accent)] shadow-xs animate-fade-in">
          <Brain className="h-3.5 w-3.5" />
          <span>100% GRATUITO · SEGUNDO CÉREBRO COGNITIVO COM IA</span>
        </div>

        {/* Título Principal de Impacto */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-4xl leading-[1.15]">
          Sua mente livre para pensar. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600">
            Suas ideias organizadas por IA.
          </span>
        </h1>

        {/* Subtítulo da Proposta de Valor */}
        <p className="text-sm sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Capture insights de voz em tempo real, salve referências e deixe a inteligência artificial
          sintetizar conceitos, gerar tags neurais e extrair suas tarefas prioritárias para hoje.
        </p>

        {/* Ações do Hero */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-[var(--accent)] hover:bg-[#ea580c] text-white shadow-lg hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Acessar Plataforma Grátis</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <a
            href="#diferenciais"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Por que o SynapseNotes?</span>
          </a>
        </div>

        {/* Destaque visual: Acesso Imediato com Conta Admin */}
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 pt-1 font-medium">
          <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
          <span>Ambiente liberado: Acesso instantâneo como Administrador para testes.</span>
        </div>

        {/* Mockup do Dashboard na Paleta Oficial (Inspirado no Design de Referência) */}
        <div className="w-full max-w-5xl pt-8 sm:pt-12">
          <div className="rounded-2xl sm:rounded-3xl border border-stone-800 bg-stone-950 p-3 sm:p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] text-left space-y-4 relative overflow-hidden">
            {/* Top Bar do Mockup */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 text-stone-400 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 font-mono text-[11px] text-stone-500 hidden sm:inline">
                  synapsenotes.space / app
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] text-amber-400 font-medium">
                  IA Online · Sinapses Ativas
                </span>
              </div>
            </div>

            {/* Grid dos Cards do Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Foco Hoje */}
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-amber-500 font-bold tracking-tight">
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5" /> Foco Hoje
                  </span>
                  <span className="text-[11px] text-stone-400 font-sans font-medium">2/3</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800/80 text-[11px] text-stone-200 flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded border border-amber-500/70 bg-amber-500/10 mt-0.5 shrink-0" />
                    <span>Revisar hipótese de plasticidade neural para o artigo</span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800/80 text-[11px] text-stone-200 flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded border border-stone-700 mt-0.5 shrink-0" />
                    <span>Preparar síntese da tese acadêmica</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Captura de Voz em Tempo Real */}
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-200 font-bold tracking-tight">
                  <span className="flex items-center gap-1.5 text-stone-100">
                    <Mic className="h-3.5 w-3.5 text-red-400 animate-pulse" /> Gravação por Voz JIT
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">01:42</span>
                </div>
                {/* Waveform simulada */}
                <div className="h-10 bg-stone-950/80 rounded-lg border border-stone-800/80 flex items-end justify-between px-2 py-1.5 gap-1">
                  {[30, 60, 45, 90, 75, 40, 85, 95, 60, 35, 70, 80, 50, 65, 30].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-amber-500/80 rounded-t-xs"
                        style={{ height: `${h}%` }}
                      />
                    ),
                  )}
                </div>
                <p className="text-[10px] text-stone-400 italic truncate">
                  "A memória é fixada por sinapses recorrentes..."
                </p>
              </div>

              {/* Card 3: Síntese e Tags Neurais */}
              <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-stone-200 font-bold tracking-tight">
                  <span className="flex items-center gap-1.5 text-stone-100">
                    <Brain className="h-3.5 w-3.5 text-amber-500" /> Síntese Cognitiva
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">94% relevância</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-snug line-clamp-2">
                  "Conceito de consolidação de memórias no hipocampo articulado com novos dados experimentais."
                </p>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[9px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    #Neurociência
                  </span>
                  <span className="text-[9px] font-medium bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">
                    #Hipocampo
                  </span>
                  <span className="text-[9px] font-medium bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">
                    #Memória
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SEÇÃO DE VANTAGENS (DIFERENCIAIS VS. NOTAS TRADICIONAIS) */}
      {/* ========================================================================= */}
      <section
        id="diferenciais"
        className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--surface-subtle)] border-y border-[var(--border)]"
      >
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Cabeçalho da Seção (Inspirado no Print de Referência) */}
          <div className="space-y-3 text-left">
            <span className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] block">
              EM NÚMEROS & PRODUTIVIDADE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-2xl leading-tight">
              O que muda na rotina quando suas notas pensam com você
            </h2>
            <p className="text-xs sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Nada de listar tarefas no caderno, pastas estáticas esquecidas ou confirmar por mensagem. O
              SynapseNotes captura por voz, conecta ideias e organiza tarefas no mesmo lugar.
            </p>
          </div>

          {/* Cards Comparativos em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Diferencial 1: Voz JIT */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4 hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Mic className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  Captura por Voz Instantânea (JIT)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Em vez de perder minutos digitando no teclado do celular, grave pensamentos espontâneos. A
                  permissão é solicitada exclusivamente no clique (sem consumo de bateria em segundo plano) e a
                  IA transcreve na íntegra.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-medium">
                ❌ Keep / Apple Notes: digitação manual cansativa
              </div>
            </div>

            {/* Diferencial 2: Tags Neurais com Set O(1) */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4 hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  Organização Neural por Tags
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Diga adeus a pastas estáticas e profundas onde notas morrem esquecidas. O motor extrai tags
                  conceituais automaticamente, permitindo filtros multidimensionais simultâneos de alta performance
                  baseados em <span className="font-mono text-[10px]">Set&lt;string&gt;</span>.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-medium">
                ❌ Notion: árvores de pastas que viram gavetas desorganizadas
              </div>
            </div>

            {/* Diferencial 3: Tarefas Cognitivas e Histórico Temporal */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4 hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  Tarefas Extraídas & Registro Temporal
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  A IA identifica compromissos e prazos citados nas suas notas e os converte em tarefas
                  acionáveis no "Foco Hoje" (máx 3). Ao finalizar, armazena o carimbo exato contendo dia, mês, ano
                  e horário de conclusão.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] font-medium">
                ❌ Apps comuns: tarefas ficam perdidas dentro do texto
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PÚBLICO-ALVO ATUAL (FASE MVP) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] block">
            PÚBLICO-ALVO (FASE MVP)
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
            Construído para mentes que operam com alta densidade de informação
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Seja revisando para um concurso, redigindo um artigo acadêmico ou orquestrando produtos digitais, o
            SynapseNotes se adapta à sua carga mental.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Persona 1: Estudantes */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Estudantes & Vestibulandos
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Resuma capítulos densos, revise conceitos e transforme aulas em fichas de estudo inteligentes com
              prioridades diárias.
            </p>
          </div>

          {/* Persona 2: Pesquisadores */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FlaskConical className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Pesquisadores & Acadêmicos
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Indexe links para estudos, relatórios e artigos, criando um grafo de correlações semânticas entre
              ideias divergentes.
            </p>
          </div>

          {/* Persona 3: Desenvolvedores */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Devs & Engenheiros
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Grave insights de arquitetura de software enquanto caminha ou toma café, sem parar o foco de
              programação para digitar.
            </p>
          </div>

          {/* Persona 4: Solopreneurs */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3 hover:shadow-md transition-all">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Rocket className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Solopreneurs & Criadores
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Centralize ideias de produtos, pautas de conteúdo e tarefas em um só fluxo com execução
              prioritária no Foco Hoje.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEÇÃO DE APOIO AO CRIADOR (CHAVE PIX VOLUNTÁRIA) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[var(--surface-subtle)] border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-10 shadow-lg text-center space-y-6 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Heart className="h-3.5 w-3.5 fill-current" />
            <span>APOIE O PROJETO INDEPENDENTE</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Gostou do SynapseNotes? Apoie o Criador via PIX
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
              O SynapseNotes é um projeto 100% gratuito e livre de anúncios. Se a aplicação economiza seu tempo e
              ajuda a clarear sua mente, qualquer apoio voluntário contribui diretamente para custear os servidores e
              as APIs de IA.
            </p>
          </div>

          {/* Card da Chave PIX com Cópia em 1 Clique */}
          <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-[var(--accent)]" /> Chave PIX Oficial:
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Chave Aleatória / E-mail</span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] font-mono text-xs text-[var(--text-primary)]">
              <span className="truncate select-all">{pixKey}</span>
              <button
                type="button"
                onClick={handleCopyPix}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-[var(--accent)] text-white hover:bg-[#ea580c] transition-all shrink-0 cursor-pointer shadow-xs"
                title="Copiar chave PIX"
              >
                {copiedPix ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar PIX</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              Escaneie ou copie a chave acima em qualquer aplicativo bancário. Muito obrigado pelo incentivo!
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION FINAL */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Pronto para desocupar sua mente?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Entre agora mesmo e experimente o fluxo de captura por voz e síntese cognitiva.
        </p>
        <button
          onClick={onEnterApp}
          className="px-8 py-3.5 rounded-xl text-sm font-bold bg-[var(--accent)] hover:bg-[#ea580c] text-white shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Abrir SynapseNotes Agora</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8 text-xs text-[var(--text-muted)]">
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center md:justify-between gap-4 text-center md:text-left">
          {/* Logo e Nome */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/imagemlogo/logo_synapsenotes.png"
              alt="SynapseNotes Logo"
              className="h-7 sm:h-8 w-auto max-h-8 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
            />
            <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap text-sm sm:text-base">SynapseNotes</span>
          </div>

          {/* Links agrupados com espaçamento adequado para toque (gap-3) em mobile e linha no desktop */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-medium">
            <button
              onClick={onEnterApp}
              className="py-1 px-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Acessar Plataforma
            </button>
            <a
              href="#diferenciais"
              className="py-1 px-1.5 hover:text-[var(--text-primary)] transition-colors"
            >
              Vantagens
            </a>
            <a
              href="https://github.com/Kauabrandaorocha"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md hover:text-white hover:bg-stone-800/60 transition-colors"
              title="Acessar perfil no GitHub"
            >
              <Github className="h-3.5 w-3.5 shrink-0" />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com/in/kauabrandao18"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md hover:text-white hover:bg-stone-800/60 transition-colors"
              title="Acessar perfil no LinkedIn"
            >
              <Linkedin className="h-3.5 w-3.5 shrink-0" />
              <span>LinkedIn</span>
            </a>
            <button
              onClick={onEnterApp}
              className="py-1 px-1.5 text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              Entrar como Admin
            </button>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-stone-400">
            <span className="text-stone-300 font-medium whitespace-nowrap">SynapseNotes</span> © {new Date().getFullYear()} • Desenvolvido por <span className="text-stone-200 font-semibold">Kauã Brandão</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
