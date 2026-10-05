/**
 * Interface tokens from /docs/DESIGN.md (front matter). CSS mirrors these values as
 * custom properties in src/styles/tokens.css; keep both in sync with DESIGN.md.
 */
export const designTokens = {
  color: {
    ink: '#172228',
    inkMuted: '#6B4A2A',
    kraft: '#C8955C',
    kraftShade: '#B07E48',
    kraftLight: '#DDB07A',
    kraftEdge: '#8A5A2B',
    paper: '#F6EBD3',
    paperLine: '#D8CFB8',
    tape: '#F2C230',
    tapeStripe: '#E5B220',
    stampRed: '#C8402E',
    stampGreen: '#2F7D3A',
    stampBlue: '#3D5A80',
    carbonBlue: '#2F4F8F',
    brandGreen: '#1F4D3A',
  },
  font: {
    display: '"Fredoka", "Nunito", system-ui, sans-serif',
    ui: '"Nunito", system-ui, sans-serif',
    marker: '"Permanent Marker", "Fredoka", cursive',
  },
  sizePxAtReference: { gameplayMinText: 28, menuBody: 24, menuButton: 32, screenTitle: 64, keyCap: 64 },
  strokePxAtReference: { uiOutline: 3, stickerBorder: 4, focusRing: 5 },
} as const;
