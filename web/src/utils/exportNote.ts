import { jsPDF } from 'jspdf';
import type { ApiNote, ApiRelation } from '../services/api.ts';
import { cleanNoteTitle, getNoteLink } from './noteHelpers.ts';

/**
 * Sanitiza o nome do arquivo para download no sistema de arquivos local
 */
function sanitizeFilename(title: string, extension: string): string {
  const safe = (title || 'nota')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60)
    .replace(/^_+|_+$/g, '');

  return `${safe || 'nota'}.${extension}`;
}

/**
 * Dispara o download de um Blob no cliente de forma transparente e segura,
 * revogando a URL temporária imediatamente após o clique para não deixar rastros na memória.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

/**
 * Exporta a nota no formato Markdown (.md)
 */
export function exportNoteToMarkdown(
  note: ApiNote,
  relations: ApiRelation[] = []
): void {
  const title = cleanNoteTitle(note.title) || 'Nota sem título';
  const createdAtFormatted = new Date(note.createdAt).toLocaleString('pt-BR');
  const tagsList = note.tags && note.tags.length > 0
    ? note.tags.map((t) => `#${t.name}`).join(' ')
    : 'Nenhuma tag';

  let md = `# ${title}\n\n`;
  md += `> **Data de Criação:** ${createdAtFormatted}\n`;
  md += `> **Tags:** ${tagsList}\n`;

  if (note.sourceType) {
    const originLabel =
      note.sourceType === 'audio'
        ? 'Gravação de Voz / Áudio'
        : note.sourceType === 'link'
        ? 'Artigo Web / Link Externo'
        : 'Texto / Rascunho';
    md += `> **Origem:** ${originLabel}\n`;
  }

  const externalLink = getNoteLink(note);
  if (externalLink) {
    md += `> **Referência:** [${externalLink}](${externalLink})\n`;
  }

  md += `\n---\n\n`;

  // 1. Síntese IA
  if (note.summary && note.summary.trim()) {
    md += `## ✨ Síntese Gerada pela IA\n\n`;
    md += `${note.summary.trim()}\n\n`;
    md += `---\n\n`;
  }

  // 2. Transcrição completa do áudio (se houver)
  if (note.transcription && note.transcription.trim()) {
    md += `## 🎙️ Transcrição Completa do Áudio\n\n`;
    md += `${note.transcription.trim()}\n\n`;
    md += `---\n\n`;
  }

  // 3. Conteúdo / Texto Principal
  md += `## 📝 Conteúdo Principal\n\n`;
  if (note.rawContent && note.rawContent.trim()) {
    md += `${note.rawContent.trim()}\n\n`;
  } else {
    md += `*Sem conteúdo textual adicional.*\n\n`;
  }

  // 4. Lista de Sinapses / Conexões Relacionadas
  if (relations && relations.length > 0) {
    md += `---\n\n`;
    md += `## 🧠 Sinapses Conectadas (${relations.length})\n\n`;
    relations.forEach((rel) => {
      const affinity = Math.round((rel.similarityScore || 0) * 100);
      md += `- **${rel.targetNoteTitle || 'Nota Relacionada'}** (${affinity}% de afinidade conceituada)\n`;
      if (rel.reason && rel.reason.trim()) {
        md += `  > *${rel.reason.trim()}*\n`;
      }
      md += `\n`;
    });
  }

  md += `---\n`;
  md += `*Documento gerado localmente pelo SynapseNotes — Segundo Cérebro com Inteligência Artificial.*`;

  const filename = sanitizeFilename(title, 'md');
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Quebra o texto respeitando quebras de linha manuais (white-space: pre-wrap)
 * e dividindo palavras longas indivisíveis que excedam o container (word-wrap / overflow-wrap: break-word)
 */
function wrapTextWithBreakWord(
  doc: jsPDF,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      allLines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    const safeWords: string[] = [];

    for (const word of words) {
      if (word.length === 0) {
        safeWords.push('');
        continue;
      }

      if (doc.getTextWidth(word) <= maxWidth) {
        safeWords.push(word);
      } else {
        // Quebra caractere por caractere simulando break-word
        let currentChunk = '';
        for (const char of word) {
          if (doc.getTextWidth(currentChunk + char) <= maxWidth) {
            currentChunk += char;
          } else {
            if (currentChunk) safeWords.push(currentChunk);
            currentChunk = char;
          }
        }
        if (currentChunk) safeWords.push(currentChunk);
      }
    }

    const safeParagraph = safeWords.join(' ');
    const lines = doc.splitTextToSize(safeParagraph, maxWidth);
    allLines.push(...lines);
  }

  return allLines;
}

/**
 * Exporta a nota no formato PDF com layout estilizado, tipografia sans-serif limpa e margens adequadas
 */
export function exportNoteToPDF(
  note: ApiNote,
  relations: ApiRelation[] = []
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174mm
  const bottomLimit = pageHeight - 24;

  let y = 20;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > bottomLimit) {
      doc.addPage();
      y = 20;
    }
  };

  const title = cleanNoteTitle(note.title) || 'Nota sem título';
  const createdAtFormatted = new Date(note.createdAt).toLocaleString('pt-BR');
  const tagsStr = note.tags && note.tags.length > 0
    ? note.tags.map((t) => `#${t.name}`).join('  ')
    : '';

  // 1. Cabeçalho Superior da Marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(249, 115, 22); // Cor de destaque laranja/âmbar Synapse
  doc.text('SYNAPSENOTES • SEGUNDO CÉREBRO COM INTELIGÊNCIA ARTIFICIAL', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Exportação de Nota de Pesquisa', pageWidth - marginX, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // 2. Título da Nota
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  ensureSpace(titleLines.length * 7 + 4);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 7 + 2;

  // 3. Metadados (Data, Tags, Origem)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(113, 113, 122);
  let metaLine = `Criada em: ${createdAtFormatted}`;
  if (note.sourceType) {
    const originLabel =
      note.sourceType === 'audio'
        ? 'Áudio/Voz'
        : note.sourceType === 'link'
        ? 'Artigo Web'
        : 'Texto';
    metaLine += `  •  Origem: ${originLabel}`;
  }
  doc.text(metaLine, marginX, y);
  y += 5;

  if (tagsStr) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(249, 115, 22);
    doc.text(tagsStr, marginX, y);
    y += 5;
  }

  const externalLink = getNoteLink(note);
  if (externalLink) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    const linkLines = doc.splitTextToSize(`Link de referência: ${externalLink}`, contentWidth);
    ensureSpace(linkLines.length * 4.5);
    doc.text(linkLines, marginX, y);
    y += linkLines.length * 4.5;
  }

  y += 3;
  doc.setDrawColor(240, 240, 242);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  // 4. Síntese Gerada pela IA
  if (note.summary && note.summary.trim()) {
    // Configura previamente tipografia da síntese para cálculo exato de largura
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    // Dimensões do container (box-sizing: border-box sobre 100% da largura útil)
    const boxWidth = contentWidth; // 100% width
    const accentLineWidth = 1.4; // border-left: ~4px solid #f97316
    const paddingLeft = 5.5; // Espaço interno esquerdo (~16px incluindo borda)
    const paddingRight = 5.0; // Espaço interno direito (~16px)
    const paddingTop = 4.0; // Espaço interno superior (~12px)
    const paddingBottom = 4.0; // Espaço interno inferior (~12px)

    const availableTextWidth = boxWidth - paddingLeft - paddingRight;

    // Quebra automática de linha rigorosa (word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap)
    const summaryLines = wrapTextWithBreakWord(doc, note.summary.trim(), availableTextWidth);

    const titleLineHeight = 5.0;
    const textLineHeight = 4.5;
    const blockHeight = paddingTop + titleLineHeight + (summaryLines.length * textLineHeight) + paddingBottom;

    ensureSpace(blockHeight);

    // Container com padding e largura 100% calculada (box-sizing: border-box)
    doc.setFillColor(249, 250, 251); // Fundo cinza suave (#f9fafb)
    doc.setDrawColor(228, 228, 231); // Borda neutra (#e4e4e7)
    doc.setLineWidth(0.35);
    doc.rect(marginX, y, boxWidth, blockHeight, 'FD');

    // Borda lateral laranja integrada: exatamente 100% da altura da caixa, perfeitamente alinhada à esquerda
    doc.setFillColor(249, 115, 22); // #f97316
    doc.rect(marginX, y, accentLineWidth, blockHeight, 'F');

    // Título da seção dentro do container com padding adequado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(194, 65, 12); // Âmbar/laranja escuro (#c2410c)
    doc.text('SÍNTESE GERADA PELA IA', marginX + paddingLeft, y + paddingTop + 3.2);

    // Texto da síntese confinado estritamente dentro da caixa
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(39, 39, 42); // #27272a

    let lineY = y + paddingTop + titleLineHeight + 3.2;
    for (const line of summaryLines) {
      if (line) {
        doc.text(line, marginX + paddingLeft, lineY);
      }
      lineY += textLineHeight;
    }

    y += blockHeight + 7;
  }

  // 5. Transcrição de Áudio (se houver)
  if (note.transcription && note.transcription.trim()) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(24, 24, 27);
    doc.text('TRANSCRIÇÃO COMPLETA DO ÁUDIO', marginX, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(63, 63, 70);
    const transLines = doc.splitTextToSize(note.transcription.trim(), contentWidth);
    for (const line of transLines) {
      ensureSpace(4.5);
      doc.text(line, marginX, y);
      y += 4.5;
    }
    y += 5;
  }

  // 6. Conteúdo Principal
  ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 24, 27);
  doc.text('CONTEÚDO PRINCIPAL', marginX, y);
  y += 5.5;

  const contentText = note.rawContent && note.rawContent.trim()
    ? note.rawContent.trim()
    : 'Sem conteúdo textual adicional.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(39, 39, 42);
  const contentLines = doc.splitTextToSize(contentText, contentWidth);

  for (const line of contentLines) {
    ensureSpace(4.8);
    doc.text(line, marginX, y);
    y += 4.8;
  }
  y += 6;

  // 7. Lista de Sinapses / Conexões Relacionadas
  if (relations && relations.length > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(24, 24, 27);
    doc.text(`SINAPSES CONECTADAS (${relations.length})`, marginX, y);
    y += 6;

    relations.forEach((rel) => {
      const affinity = Math.round((rel.similarityScore || 0) * 100);
      const targetTitle = rel.targetNoteTitle || 'Nota Relacionada';
      const reasonText = rel.reason ? rel.reason.trim() : '';

      const reasonLines = reasonText ? doc.splitTextToSize(reasonText, contentWidth - 6) : [];
      const itemHeight = 7 + (reasonLines.length ? reasonLines.length * 4.2 + 2 : 0);

      ensureSpace(itemHeight + 2);

      // Bullet e Título com Afinidade
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(24, 24, 27);
      doc.text(`• ${targetTitle}`, marginX + 2, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(249, 115, 22);
      doc.text(`${affinity}% afinidade`, pageWidth - marginX, y, { align: 'right' });
      y += 4.5;

      if (reasonLines.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(113, 113, 122);
        doc.text(reasonLines, marginX + 6, y);
        y += reasonLines.length * 4.2 + 2;
      }

      y += 2;
    });
  }

  // 8. Rodapé em todas as páginas com numeração
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha divisória de rodapé
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      'SynapseNotes — Segundo Cérebro • Documento gerado com segurança local',
      marginX,
      pageHeight - 9
    );

    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: 'right' }
    );
  }

  const filename = sanitizeFilename(title, 'pdf');
  doc.save(filename);
}
