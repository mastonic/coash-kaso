'use client';

import jsPDF from 'jspdf';

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

// ── Couleurs ──────────────────────────────────────────────────────────────
const C = {
  bg:       [245, 246, 250] as [number,number,number],
  dark:     [28,  35,  49 ] as [number,number,number],
  white:    [255, 255, 255] as [number,number,number],
  accent1:  [232, 80,  26 ] as [number,number,number],  // orange
  accent2:  [26,  111, 232] as [number,number,number],  // bleu
  accent3:  [245, 166, 35 ] as [number,number,number],  // jaune
  gray:     [136, 150, 168] as [number,number,number],
  text:     [61,  74,  92 ] as [number,number,number],
  grass1:   [42,  100, 48 ] as [number,number,number],
  grass2:   [36,  90,  42 ] as [number,number,number],
  lineW:    [255, 255, 255] as [number,number,number],
  attBody:  [245, 166, 35 ] as [number,number,number],
  attBrd:   [196, 125, 0  ] as [number,number,number],
  defBody:  [232, 80,  26 ] as [number,number,number],
  defBrd:   [168, 48,  16 ] as [number,number,number],
  movPasse: [245, 166, 35 ] as [number,number,number],
  movDrib:  [57,  255, 20 ] as [number,number,number],
  movDep:   [200, 200, 200] as [number,number,number],
};

type RGB = [number,number,number];

// ── Terrain dessiné dans jsPDF ────────────────────────────────────────────
function drawField(
  doc: jsPDF,
  fx: number, fy: number, fw: number, fh: number,
  players: Array<{ x: number; y: number; number?: number; team: string }>,
  movements: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; style?: string }>
) {
  const PAD = 3;
  const fieldX = fx + PAD;
  const fieldY = fy + PAD;
  const fieldW = fw - PAD * 2;
  const fieldH = fh - PAD * 2;

  const toX = (pct: number) => fieldX + (pct / 100) * fieldW;
  const toY = (pct: number) => fieldY + (pct / 100) * fieldH;

  // Bandes de gazon
  const STRIPES = 7;
  const sw = fieldW / STRIPES;
  for (let i = 0; i < STRIPES; i++) {
    const col: RGB = i % 2 === 0 ? C.grass1 : C.grass2;
    doc.setFillColor(...col);
    doc.rect(fieldX + i * sw, fieldY, sw, fieldH, 'F');
  }

  // Bordure
  doc.setDrawColor(...C.lineW);
  doc.setLineWidth(0.5);
  doc.rect(fieldX, fieldY, fieldW, fieldH, 'S');

  // Ligne médiane
  doc.setLineWidth(0.35);
  doc.line(fieldX + fieldW / 2, fieldY, fieldX + fieldW / 2, fieldY + fieldH);

  // Cercle central
  doc.setLineWidth(0.3);
  const cr = Math.min(fieldW, fieldH) * 0.1;
  doc.circle(fieldX + fieldW / 2, fieldY + fieldH / 2, cr, 'S');
  doc.setFillColor(...C.lineW);
  doc.circle(fieldX + fieldW / 2, fieldY + fieldH / 2, 0.8, 'F');

  // Surfaces de réparation
  doc.setLineWidth(0.25);
  doc.setDrawColor(255, 255, 255);
  // Gauche
  doc.rect(fieldX, fieldY + fieldH * 0.28, fieldW * 0.14, fieldH * 0.44, 'S');
  doc.rect(fieldX, fieldY + fieldH * 0.38, fieldW * 0.065, fieldH * 0.24, 'S');
  // Droite
  doc.rect(fieldX + fieldW * 0.86, fieldY + fieldH * 0.28, fieldW * 0.14, fieldH * 0.44, 'S');
  doc.rect(fieldX + fieldW * 0.935, fieldY + fieldH * 0.38, fieldW * 0.065, fieldH * 0.24, 'S');

  // Buts
  doc.setFillColor(255, 255, 255, 30);
  doc.setDrawColor(...C.lineW);
  doc.setLineWidth(0.8);
  doc.rect(fieldX - 2.5, fieldY + fieldH * 0.41, 2.5, fieldH * 0.18, 'FD');
  doc.rect(fieldX + fieldW, fieldY + fieldH * 0.41, 2.5, fieldH * 0.18, 'FD');

  // Mouvements (flèches)
  for (const mov of movements) {
    const x1 = toX(mov.from.x);
    const y1 = toY(mov.from.y);
    const x2 = toX(mov.to.x);
    const y2 = toY(mov.to.y);

    let col: RGB = C.movPasse;
    let dashed = false;
    if (mov.style === 'dribble')      { col = C.movDrib; dashed = true; }
    if (mov.style === 'déplacement')  { col = C.movDep;  dashed = true; }

    // Raccourcit la ligne
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const r = 3.5;
    const fac = len > r * 2.5 ? (len - r) / len : 1;
    const lx1 = x1 + (dx / len) * r;
    const ly1 = y1 + (dy / len) * r;
    const lx2 = x1 + dx * fac;
    const ly2 = y1 + dy * fac;

    doc.setDrawColor(...col);
    doc.setLineWidth(0.55);
    if (dashed) {
      // jsPDF dash simulation: draw small segments
      const segLen = 2, gapLen = 1.5;
      const totalLen = Math.sqrt((lx2 - lx1) ** 2 + (ly2 - ly1) ** 2);
      let drawn = 0;
      const ux = (lx2 - lx1) / totalLen;
      const uy = (ly2 - ly1) / totalLen;
      let drawing = true;
      while (drawn < totalLen) {
        const segEnd = Math.min(drawn + (drawing ? segLen : gapLen), totalLen);
        if (drawing) {
          doc.line(
            lx1 + ux * drawn, ly1 + uy * drawn,
            lx1 + ux * segEnd, ly1 + uy * segEnd
          );
        }
        drawn = segEnd;
        drawing = !drawing;
      }
    } else {
      doc.line(lx1, ly1, lx2, ly2);
    }

    // Pointe de flèche
    const angle = Math.atan2(ly2 - ly1, lx2 - lx1);
    const AL = 2.5, AW = 1.2;
    const ax1 = lx2 - AL * Math.cos(angle) + AW * Math.sin(angle);
    const ay1 = ly2 - AL * Math.sin(angle) - AW * Math.cos(angle);
    const ax2 = lx2 - AL * Math.cos(angle) - AW * Math.sin(angle);
    const ay2 = ly2 - AL * Math.sin(angle) + AW * Math.cos(angle);
    doc.setFillColor(...col);
    doc.triangle(lx2, ly2, ax1, ay1, ax2, ay2, 'F');
  }

  // Joueurs
  for (const player of players) {
    const x = toX(player.x);
    const y = toY(player.y);
    const isAtt = player.team === 'attaque';
    const bodyCol: RGB = isAtt ? C.attBody : C.defBody;
    const brdCol: RGB  = isAtt ? C.attBrd  : C.defBrd;
    const R = 3.2;

    // Ombre
    doc.setFillColor(0, 0, 0);
    doc.setGState && doc.setGState(doc.GState({ opacity: 0.3 }));
    doc.circle(x + 0.5, y + 0.8, R + 0.4, 'F');
    doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

    // Corps
    doc.setFillColor(...bodyCol);
    doc.setDrawColor(...brdCol);
    doc.setLineWidth(0.4);
    doc.circle(x, y, R, 'FD');

    // Tête
    doc.setFillColor(245, 203, 167);
    doc.setDrawColor(...brdCol);
    doc.setLineWidth(0.3);
    doc.circle(x, y - R - 1.8, 1.7, 'FD');

    // Numéro
    if (player.number !== undefined) {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(String(player.number), x, y + 0.8, { align: 'center' });
    }
  }

  // Légende compacte
  const hasAtt = players.some(p => p.team === 'attaque');
  const hasDef = players.some(p => p.team === 'défense');
  const hasPasse = movements.some(m => !m.style || m.style === 'passe');
  const hasDrib  = movements.some(m => m.style === 'dribble');
  const hasDep   = movements.some(m => m.style === 'déplacement');

  const lItems: Array<{ label: string; color: RGB; circle?: boolean; dash?: boolean }> = [];
  if (hasAtt)   lItems.push({ label: 'Attaque',  color: C.attBody, circle: true });
  if (hasDef)   lItems.push({ label: 'Défense',  color: C.defBody, circle: true });
  if (hasPasse) lItems.push({ label: 'Passe',    color: C.movPasse });
  if (hasDrib)  lItems.push({ label: 'Dribble',  color: C.movDrib, dash: true });
  if (hasDep)   lItems.push({ label: 'Déplact.', color: C.movDep,  dash: true });

  if (lItems.length > 0) {
    const lgW = lItems.length * 22 + 4;
    const lgX = fieldX + 2;
    const lgY = fieldY + fieldH - 6;
    doc.setFillColor(0, 0, 0);
    doc.setGState && doc.setGState(doc.GState({ opacity: 0.55 }));
    doc.roundedRect(lgX, lgY, lgW, 5.5, 1, 1, 'F');
    doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

    lItems.forEach((item, i) => {
      const ix = lgX + 2 + i * 22;
      const iy = lgY + 3;
      doc.setFontSize(4);
      doc.setFont('helvetica', 'normal');

      if (item.circle) {
        doc.setFillColor(...item.color);
        doc.circle(ix + 1.5, iy, 1.5, 'F');
      } else {
        doc.setDrawColor(...item.color);
        doc.setLineWidth(0.6);
        if (item.dash) {
          doc.line(ix, iy, ix + 5, iy);
        } else {
          doc.line(ix, iy, ix + 5, iy);
        }
        doc.setFillColor(...item.color);
        doc.triangle(ix + 5, iy, ix + 3, iy - 1, ix + 3, iy + 1, 'F');
      }

      doc.setTextColor(220, 220, 220);
      doc.text(item.label, ix + 4, iy + 1.2);
    });
  }
}

// ── Fonction principale export PDF ────────────────────────────────────────
function parseIllustration(raw?: string): {
  players: Array<{ x: number; y: number; number?: number; team: string }>;
  movements: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; style?: string }>;
} | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (d.players && Array.isArray(d.players) && d.players.length > 0) {
      return { players: d.players, movements: d.movements || [] };
    }
  } catch { /* not JSON */ }
  return null;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

function rgb(doc: jsPDF, col: RGB) {
  doc.setTextColor(col[0], col[1], col[2]);
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;
    const M = 10; // margin

    let page = 1;

    const addPage = () => {
      doc.addPage();
      page++;
      drawPageBg(doc, PW, PH);
      drawFooter(doc, PW, PH, page);
    };

    const drawPageBg = (d: jsPDF, w: number, h: number) => {
      d.setFillColor(...C.bg);
      d.rect(0, 0, w, h, 'F');
    };

    const drawFooter = (d: jsPDF, w: number, h: number, p: number) => {
      d.setFillColor(...C.dark);
      d.rect(0, h - 8, w, 8, 'F');
      d.setFillColor(...C.accent1);
      d.rect(0, h - 8, w, 0.5, 'F');
      d.setFontSize(6.5);
      d.setFont('helvetica', 'normal');
      rgb(d, C.gray);
      d.text('PROSEANCE · Générateur de séances IA', M, h - 3);
      d.text(`Page ${p}`, w - M, h - 3, { align: 'right' });
    };

    // ── PAGE 1 : HEADER ──────────────────────────────────────────────────
    drawPageBg(doc, PW, PH);
    drawFooter(doc, PW, PH, 1);

    // Header band
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 40, 'F');
    doc.setFillColor(...C.accent1);
    doc.rect(0, 40, PW, 1.5, 'F');

    // Badge sport
    doc.setFillColor(...C.accent1);
    doc.roundedRect(M, 6, 24, 7, 1.5, 1.5, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    rgb(doc, C.white);
    doc.text('FOOTBALL', M + 12, 11, { align: 'center' });

    // Badge catégorie
    doc.setFillColor(...C.accent2);
    doc.roundedRect(M + 27, 6, 16, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(school.toUpperCase().substring(0, 5), M + 35, 11, { align: 'center' });

    // Titre
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    rgb(doc, C.white);
    doc.text("SÉANCE D'ENTRAÎNEMENT", PW / 2, 20, { align: 'center' });

    // Sous-titre
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Thème : ${theme.charAt(0).toUpperCase() + theme.slice(1)} · École ${school}`, PW / 2, 27, { align: 'center' });

    // Méta pills
    const metaItems = [
      { label: 'JOUEURS', val: `${playerCount}` },
      { label: 'CHARGE',  val: load },
      { label: 'DATE',    val: new Date().toLocaleDateString('fr-FR') },
    ];
    let mx = PW - M;
    for (const mi of [...metaItems].reverse()) {
      const vw = doc.getTextWidth(mi.val) + 8;
      const lw = doc.getTextWidth(mi.label) + 6;
      mx -= (vw + lw + 3);
      doc.setFontSize(6); doc.setFont('helvetica', 'normal');
      doc.setFillColor(...C.dark);
      doc.roundedRect(mx, 30, lw, 6, 1, 1, 'F');
      rgb(doc, C.gray);
      doc.text(mi.label, mx + lw / 2, 34, { align: 'center' });
      doc.setFillColor(...C.accent3);
      doc.roundedRect(mx + lw + 1, 30, vw, 6, 1, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      rgb(doc, C.dark);
      doc.text(mi.val, mx + lw + 1 + vw / 2, 34.5, { align: 'center' });
      mx -= 4;
    }

    // ── EXERCICES ─────────────────────────────────────────────────────────
    let y = 48;

    const sectionColors: Record<string, RGB> = {
      '🎮 JEUX': C.accent3,
      '⚙️ EXERCICES': C.accent2,
      '🏟️ SITUATIONS': C.accent1,
    };

    const allSections = [
      { label: '🎮 JEUX', items: games },
      { label: '⚙️ EXERCICES', items: exercises },
      { label: '🏟️ SITUATIONS', items: situations },
    ];

    for (const section of allSections) {
      const scol = sectionColors[section.label];

      // Section header
      if (y > PH - 50) { addPage(); y = 15; }

      doc.setFillColor(...C.dark);
      doc.setDrawColor(...scol);
      doc.setLineWidth(0.5);
      doc.roundedRect(M, y, PW - M * 2, 8, 2, 2, 'FD');
      doc.setFillColor(...scol);
      doc.rect(M, y, 2.5, 8, 'F');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
      rgb(doc, C.white);
      doc.text(section.label.toUpperCase(), M + 6, y + 5.5);
      y += 11;

      for (let idx = 0; idx < section.items.length; idx++) {
        const item = section.items[idx];
        const diagram = parseIllustration(item.illustration);

        // Estimer hauteur carte
        const hasField = diagram !== null;
        const textW = hasField ? (PW - M * 2) * 0.48 : (PW - M * 2 - 8);
        const objLines = wrapText(doc, item.objective || '', textW - 6);
        const cntLines = wrapText(doc, item.content || '', textW - 6);
        const detLines = wrapText(doc, [item.setup, item.technique, item.fieldSetup].filter(Boolean).join(' · ') || '', textW - 6);
        const textRows = objLines.length + cntLines.length + detLines.length;
        const estimH = Math.max(hasField ? 62 : 30, textRows * 4.5 + 30);
        const cardH = Math.min(estimH, 85);

        if (y + cardH > PH - 15) { addPage(); y = 15; }

        const cw = PW - M * 2;
        const cx = M;

        // Carte fond blanc
        doc.setFillColor(...C.white);
        doc.setDrawColor(226, 230, 237);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y, cw, cardH, 3, 3, 'FD');

        // Barre colorée gauche
        doc.setFillColor(...scol);
        doc.rect(cx, y, 3, cardH, 'F');

        // Header carte
        doc.setFillColor(...scol);
        doc.setGState && doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.roundedRect(cx + 3, y, cw - 3, 12, 0, 0, 'F');
        doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

        // Badge numéro
        doc.setFillColor(...scol);
        doc.circle(cx + 11, y + 6, 4.5, 'F');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        rgb(doc, C.white);
        doc.text(String(idx + 1), cx + 11, y + 7.5, { align: 'center' });

        // Titre exercice
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        rgb(doc, C.dark);
        doc.text(item.title || 'Sans titre', cx + 18, y + 7.5);

        // Badge durée
        const durStr = `⏱ ${item.duration || 15} min`;
        const durW = doc.getTextWidth(durStr) + 6;
        doc.setFillColor(...scol);
        doc.setGState && doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.roundedRect(cx + cw - durW - 4, y + 3, durW, 6, 1.5, 1.5, 'F');
        doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        rgb(doc, scol);
        doc.text(durStr, cx + cw - durW / 2 - 4, y + 7.2, { align: 'center' });

        // Séparateur
        doc.setDrawColor(226, 230, 237);
        doc.setLineWidth(0.25);
        doc.line(cx + 4, y + 12, cx + cw - 4, y + 12);

        // Colonnes
        const leftX = cx + 5;
        const leftW = hasField ? cw * 0.46 : cw - 8;
        const fieldX = cx + cw * 0.52;
        const fieldW = cw * 0.46;
        const fieldH = cardH - 16;
        let ty = y + 16;

        // ── Colonne texte ──
        const addBlock = (label: string, text: string, col: RGB) => {
          if (!text) return;
          if (ty > y + cardH - 6) return;
          // Label
          doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
          doc.setFillColor(...col);
          doc.rect(leftX, ty - 0.8, 1.8, 4.5, 'F');
          rgb(doc, [61, 74, 92]);
          doc.text(label.toUpperCase(), leftX + 3, ty + 3);
          ty += 5.5;
          // Contenu
          doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
          rgb(doc, C.text);
          const lines = wrapText(doc, text, leftW - 5);
          for (const line of lines) {
            if (ty > y + cardH - 4) break;
            doc.text(line, leftX + 2, ty);
            ty += 4.2;
          }
          ty += 1.5;
        };

        addBlock('Objectif', item.objective || '', scol);
        addBlock('Contenu', item.content || '', C.accent2);
        const details = [item.setup, item.technique, item.fieldSetup].filter(Boolean).join(' · ');
        addBlock('Détails', details, C.gray);

        // ── Terrain dessiné ──
        if (hasField && diagram) {
          drawField(
            doc,
            fieldX, y + 14, fieldW, fieldH,
            diagram.players,
            diagram.movements
          );
        }

        y += cardH + 4;
      }

      y += 3;
    }

    // Résumé final
    if (y + 20 > PH - 15) { addPage(); y = 15; }
    const totalMin = [...games, ...exercises, ...situations].reduce((acc, i) => acc + (i.duration || 0), 0);
    doc.setFillColor(...C.dark);
    doc.roundedRect(M, y, PW - M * 2, 16, 3, 3, 'F');
    doc.setFillColor(...C.accent1);
    doc.rect(M, y, 3, 16, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    rgb(doc, C.white);
    doc.text('RÉSUMÉ', M + 7, y + 6);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    rgb(doc, C.gray);
    doc.text(`${games.length} jeux · ${exercises.length} exercices · ${situations.length} situations · Durée totale estimée : ${totalMin} min`, M + 7, y + 12);

    doc.save(`ProSeance-${theme}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={handleExportPDF}
      className="group relative px-6 py-3 bg-gradient-to-r from-[#E8501A] to-[#F5A623] text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(232,80,26,0.5)] uppercase text-sm flex items-center gap-2"
    >
      <span className="text-base">📥</span>
      <span>Télécharger PDF</span>
    </button>
  );
}
