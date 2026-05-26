'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SessionItem {
  title: string;
  objective: string;
  content: string;
  duration: number;
  illustration?: string;
  setup?: string;
  technique?: string;
  fieldSetup?: string;
}

interface SessionExportPDFProps {
  theme: string;
  load: string;
  school: string;
  playerCount: number;
  games: SessionItem[];
  exercises: SessionItem[];
  situations: SessionItem[];
}

export function SessionExportPDF({
  theme,
  load,
  school,
  playerCount,
  games,
  exercises,
  situations,
}: SessionExportPDFProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPosition = 10;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(57, 255, 20);
    doc.text('PROSEANCE - Séance d\'Entraînement', 10, yPosition);
    yPosition += 10;

    // Session Info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Thème: ${theme}`, 10, yPosition);
    yPosition += 5;
    doc.text(`Charge: ${load} | Joueurs: ${playerCount} | École: ${school}`, 10, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 10, yPosition);
    yPosition += 10;

    // Function to add section
    const addSection = (title: string, items: SessionItem[], type: string) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 10;
      }

      doc.setFontSize(14);
      doc.setTextColor(57, 255, 20);
      doc.text(title, 10, yPosition);
      yPosition += 8;

      items.forEach((item, idx) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 10;
        }

        // Item title and info
        doc.setFontSize(11);
        doc.setTextColor(243, 244, 246);
        doc.text(`${idx + 1}. ${item.title}`, 10, yPosition);
        yPosition += 6;

        // Duration and objective
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text(`⏱️ ${item.duration}m | Objectif: ${item.objective}`, 12, yPosition);
        yPosition += 5;

        // Content
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        const contentLines = doc.splitTextToSize(item.content, 180);
        doc.text(contentLines, 12, yPosition);
        yPosition += contentLines.length * 4 + 2;

        // Additional details
        if (item.setup) {
          doc.setTextColor(156, 163, 175);
          doc.text(`Setup: ${item.setup}`, 12, yPosition);
          yPosition += 4;
        }

        if (item.technique) {
          doc.setTextColor(156, 163, 175);
          doc.text(`Points clés: ${item.technique}`, 12, yPosition);
          yPosition += 4;
        }

        if (item.fieldSetup) {
          doc.setTextColor(156, 163, 175);
          doc.text(`Terrain: ${item.fieldSetup}`, 12, yPosition);
          yPosition += 4;
        }

        // Illustration (if exists)
        if (item.illustration) {
          yPosition += 2;
          doc.setFontSize(8);
          doc.setTextColor(57, 255, 20);
          doc.text('Schéma:', 12, yPosition);
          yPosition += 3;
          doc.setFontSize(7);
          doc.setTextColor(200, 200, 200);
          const illLines = item.illustration.split('\n');
          illLines.forEach(line => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 10;
            }
            doc.text(line, 15, yPosition);
            yPosition += 3;
          });
        }

        yPosition += 4;
      });

      yPosition += 5;
    };

    // Add sections
    addSection('🎮 JEUX (Possession/Rondo)', games, 'game');
    addSection('⚙️ EXERCICES (Technique)', exercises, 'exercise');
    addSection('🏟️ SITUATIONS (Match)', situations, 'situation');

    // Footer
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 10;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Généré par ProSéance - Assistant IA des Entraîneurs', 10, doc.internal.pageSize.getHeight() - 5);

    // Save PDF
    doc.save(`ProSéance-Seance-${theme}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={handleExportPDF}
      className="group relative px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#10B981] text-[#0A0F0D] font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] uppercase text-sm flex items-center gap-2"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 rounded-lg bg-white transition-opacity duration-300" />
      <span className="relative z-10">📥 Télécharger PDF</span>
    </button>
  );
}
