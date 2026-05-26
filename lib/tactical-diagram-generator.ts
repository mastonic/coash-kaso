// Generate tactical diagram descriptions for image generation
// These prompts are used to create realistic football training diagrams

export function generateDiagramPrompt(
  exerciseType: string,
  title: string,
  theme: string,
  category: string
): string {
  const basePrompt = `Professional football training tactical diagram for ${category} category players.
Exercise: ${title}
Theme: ${theme}
Type: ${exerciseType}

Style: Clear, professional training manual diagram similar to official FFF (Fédération Française de Football) training materials.
Format: Top-down view of football field with:
- Standard football pitch with lines, halfway line, penalty areas
- Player positions marked with numbered circles
- Green circles for attacking/possessing team
- Red circles for defending team
- Arrows showing movement patterns and passing directions
- Dashed lines for player movements
- Solid lines for ball passes
- Field markings clear and professional
- Similar to professional coaching manual style`;

  const typeSpecific: Record<string, string> = {
    'Jeu': `
Configuration: Show 7-11 attacking players in possession setup
Movements: Show passing patterns and positioning
Focus: Demonstrate offensive organization and spacing`,

    'Exercice': `
Configuration: Show technical drill setup with cones/zones if applicable
Movements: Show specific technical movement patterns
Focus: Highlight the technical skill being developed`,

    'Situation': `
Configuration: Show match-realistic situation with both attacking and defending players
Movements: Show tactical movements and pressing patterns
Focus: Display match-realistic defensive/attacking organization`,
  };

  const themeSpecific: Record<string, string> = {
    'possession': `Add emphasis on passing triangles and ball movement patterns. Show short passing combinations.`,
    'pressing': `Emphasize defensive positioning and forward pressing. Show coordinated pressure from multiple players.`,
    'transitions': `Show both possession and defensive phases. Highlight quick transitions and counter-attack setup.`,
    'centre': `Focus on central area. Show movements and passes through the middle of the pitch.`,
    'ailes': `Focus on wide areas. Show wing play and crosses from the flanks.`,
    'controle': `Show ball control patterns. Include tight touches and dribbling movements.`,
    'vitesse': `Show fast-paced movements and quick transitions. Highlight explosive actions.`,
    'phases': `Show structured phase of play. Include set pieces or organized attacking patterns.`,
    '1v1': `Show one-on-one situations. Include dribbler vs defender positioning.`,
  };

  return `${basePrompt}

${typeSpecific[exerciseType] || ''}
${themeSpecific[theme] || ''}

Quality: Professional training manual quality, clear and instructive
Colors: Green field, white/yellow lines, numbered player circles, clear movement arrows
Proportions: Standard football pitch dimensions
Clarity: Suitable for printing in a training manual`;
}

export function generateDiagramDescription(
  exerciseType: string,
  title: string,
  theme: string,
  category: string,
  objective: string
): string {
  return `Create a professional football coaching diagram for training manual.

EXERCISE DETAILS:
- Title: ${title}
- Type: ${exerciseType}
- Category: ${category} level
- Tactical Theme: ${theme}
- Objective: ${objective}

DIAGRAM REQUIREMENTS:
1. TOP-DOWN VIEW of football pitch
2. CLEAR FIELD MARKINGS (halfway line, penalty areas, goal lines)
3. PLAYER POSITIONING (use numbered circles, 1-11)
4. TEAM COLORS: Green = Attacking team, Red = Defending team
5. MOVEMENT ARROWS: Solid black arrows for passes, dashed for player runs
6. PROFESSIONAL STYLE: Similar to official FFE/FFF training manuals
7. LABELS: Show player positions and key movements

STYLE REFERENCE: Official French football federation (FFF) training diagrams
- Clean, professional appearance
- Easy to understand for coaches
- Suitable for printing in training materials
- Standard coaching notation`;
}
