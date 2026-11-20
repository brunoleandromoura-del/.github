// Objetos de cena. Cada um é desenhado centrado em (0,0), cabendo em ~±160.
const PROPS = {
  apple: () => `<path d="M0 -70 C-70 -130 -160 -70 -140 30 C-125 115 -60 150 0 125 C60 150 125 115 140 30 C160 -70 70 -130 0 -70z" fill="#E53935"/>
    <path d="M-95 -40 q-22 40 0 86" stroke="#fff" stroke-width="16" fill="none" opacity=".45" stroke-linecap="round"/>
    <path d="M0 -72 q4 -44 26 -62" stroke="#6D4C41" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M22 -112 q54 -44 96 -8 q-50 40 -96 8z" fill="#6BCB77"/>`,
  strawberry: () => `<path d="M0 150 C-130 70 -150 -20 -110 -70 C-70 -110 70 -110 110 -70 C150 -20 130 70 0 150z" fill="#E53935"/>
    ${[[-60, -30], [0, -40], [60, -30], [-34, 25], [34, 25], [0, 80], [-70, 20], [70, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="10" fill="#FFE082"/>`).join('')}
    <path d="M-100 -84 q50 -50 100 -16 q50 -34 100 16 q-50 30 -100 6 q-50 24 -100 -6z" fill="#43A047"/>
    <path d="M0 -100 v-34" stroke="#2E7D32" stroke-width="12" stroke-linecap="round"/>`,
  sun: (t = 0) => `<g transform="rotate(${t * 14})">${Array.from({ length: 12 }, (_, i) => `<rect x="-11" y="-162" width="22" height="50" rx="11" fill="#FFB300" transform="rotate(${i * 30})"/>`).join('')}</g>
    <circle r="102" fill="#FFD21F"/>
    <circle cx="-36" cy="-14" r="11" fill="#2B2D42"/><circle cx="36" cy="-14" r="11" fill="#2B2D42"/>
    <path d="M-36 26 q36 34 72 0" stroke="#2B2D42" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="-66" cy="20" r="14" fill="#FF8A65" opacity=".6"/><circle cx="66" cy="20" r="14" fill="#FF8A65" opacity=".6"/>`,
  banana: () => `<path d="M-140 -60 C-110 70 30 140 150 60 C160 54 158 34 144 34 C40 60 -60 10 -104 -78 C-112 -94 -144 -84 -140 -60z" fill="#FFD21F" stroke="#F2B705" stroke-width="8" stroke-linejoin="round"/>
    <path d="M-132 -84 l-14 -30" stroke="#8D6E63" stroke-width="16" stroke-linecap="round"/>
    <path d="M-80 -6 C-30 56 50 74 120 56" stroke="#fff" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/>`,
  butterfly: (t = 0) => { const f = 0.55 + 0.45 * Math.abs(Math.cos(t * 7)); const wing = `<ellipse cx="78" cy="-50" rx="78" ry="70" fill="#2979FF"/><ellipse cx="62" cy="60" rx="56" ry="52" fill="#448AFF"/><circle cx="84" cy="-52" r="26" fill="#82B1FF"/><circle cx="62" cy="60" r="16" fill="#BBDEFB"/>`;
    return `<g transform="translate(0,${Math.sin(t * 3) * 14})"><g transform="scale(${f},1)">${wing}</g><g transform="scale(${-f},1)">${wing}</g>
    <path d="M-6 -86 q-20 -40 -44 -44 M6 -86 q20 -40 44 -44" stroke="#2B2D42" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="-13" y="-90" width="26" height="190" rx="13" fill="#2B2D42"/></g>`; },
  sky: () => `<circle r="150" fill="#42A5F5"/><circle r="150" fill="none" stroke="#fff" stroke-width="14"/>
    <g fill="#fff"><ellipse cx="0" cy="30" rx="96" ry="40"/><ellipse cx="-44" cy="6" rx="50" ry="40"/><ellipse cx="34" cy="-8" rx="62" ry="50"/></g>`,
  frog: (t = 0) => `<g transform="translate(0,${-Math.abs(Math.sin(t * 4)) * 26})">
    <ellipse cx="-110" cy="110" rx="56" ry="24" fill="#2E9E4F"/><ellipse cx="110" cy="110" rx="56" ry="24" fill="#2E9E4F"/>
    <ellipse cx="0" cy="30" rx="140" ry="104" fill="#43C463"/>
    <ellipse cx="0" cy="66" rx="88" ry="56" fill="#B9F6CA"/>
    <circle cx="-66" cy="-70" r="50" fill="#43C463"/><circle cx="66" cy="-70" r="50" fill="#43C463"/>
    <circle cx="-66" cy="-72" r="32" fill="#fff"/><circle cx="66" cy="-72" r="32" fill="#fff"/>
    <circle cx="-62" cy="-70" r="16" fill="#2B2D42"/><circle cx="70" cy="-70" r="16" fill="#2B2D42"/>
    <path d="M-62 4 q62 50 124 0" stroke="#1B5E20" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="-98" cy="14" r="15" fill="#FF8A80" opacity=".7"/><circle cx="98" cy="14" r="15" fill="#FF8A80" opacity=".7"/></g>`,
  leaf: (t = 0) => `<g transform="rotate(${-30 + Math.sin(t * 2) * 5})"><path d="M0 -160 C120 -90 120 70 0 150 C-120 70 -120 -90 0 -160z" fill="#4CAF50"/>
    <path d="M0 -130 V175 M0 -60 l56 -40 M0 0 l70 -40 M0 60 l56 -36 M0 -60 l-56 -40 M0 0 l-70 -40 M0 60 l-56 -36" stroke="#2E7D32" stroke-width="9" fill="none" stroke-linecap="round"/></g>`,
  orange: () => `<circle r="140" fill="#FB8C00"/><path d="M-96 -40 q-24 44 0 92" stroke="#fff" stroke-width="16" fill="none" opacity=".4" stroke-linecap="round"/>
    <circle cx="0" cy="-128" r="12" fill="#6D4C41"/><path d="M6 -134 q54 -50 100 -14 q-52 40 -100 14z" fill="#43A047"/>
    ${[[40, 20], [70, 60], [10, 70], [60, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#EF6C00"/>`).join('')}`,
  carrot: () => `<g transform="rotate(28)"><path d="M-10 -150 q-40 -50 -50 -10 q-10 -40 10 -70 q10 30 30 40 q-6 -50 20 -70 q16 40 6 70 q30 -30 50 -20 q-10 40 -46 60z" fill="#43A047"/>
    <path d="M-62 -110 Q0 -150 62 -110 Q40 80 0 170 Q-40 80 -62 -110z" fill="#FB8C00"/>
    <path d="M-40 -50 h36 M10 0 h30 M-26 50 h28" stroke="#E65100" stroke-width="9" stroke-linecap="round"/></g>`,
  grapes: () => `<path d="M0 -120 v-40 q30 -10 50 10" stroke="#6D4C41" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M4 -150 q60 -40 104 0 q-56 34 -104 0z" fill="#43A047"/>
    ${[[-70, -80], [0, -84], [70, -80], [-36, -24], [36, -24], [-70, 30], [0, 34], [70, 30], [-36, 88], [36, 88], [0, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="42" fill="#8E24AA"/><circle cx="${x - 12}" cy="${y - 12}" r="10" fill="#fff" opacity=".35"/>`).join('')}`,
  violet: (t = 0) => `<g transform="rotate(${Math.sin(t * 2) * 6})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-84" rx="56" ry="74" fill="#9C27B0" transform="rotate(${a})"/>`).join('')}
    ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-70" rx="16" ry="40" fill="#CE93D8" transform="rotate(${a})"/>`).join('')}<circle r="36" fill="#FFD21F"/></g>`,
};
function prop(id, t = 0) { return PROPS[id] ? PROPS[id](t) : ''; }
