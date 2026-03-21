# 🎨 Palette de Couleurs - Design Épuré

## Palette Principale

### Couleurs de Base
```css
/* Fond */
--bg-primary: #FFFFFF
--bg-secondary: rgb(248 250 252) /* slate-50 */
--bg-tertiary: rgb(241 245 249) /* slate-100 */

/* Texte */
--text-primary: rgb(15 23 42) /* slate-900 */
--text-secondary: rgb(71 85 105) /* slate-600 */
--text-tertiary: rgb(148 163 184) /* slate-400 */

/* Borders */
--border-primary: rgb(226 232 240) /* slate-200 */
--border-secondary: rgb(203 213 225) /* slate-300 */

/* Accent (Seule couleur) */
--accent-purple: #8B5CF6 /* booh-purple */
--accent-purple-dark: #6d28d9
--accent-purple-light: #E5DEFF
```

## Utilisati

on

### Backgrounds
- Sections principales : `bg-white`
- Sections alternées : `bg-slate-50`
- Cards : `bg-white` avec `border-slate-200`

### Texte
- Titres principaux : `text-slate-900`
- Texte courant : `text-slate-600`
- Texte secondaire : `text-slate-500`

### Accents
- CTA Principal : `bg-slate-900` ou `bg-[#8B5CF6]`
- Hover : `bg-slate-800` ou `bg-[#7c3aed]`
- Badges : `bg-[#8B5CF6]` uniquement

### Shadows
- Légère : `shadow-sm` (cartes)
- Moyenne : `shadow-md` (hover)
- Forte : `shadow-lg shadow-[#8B5CF6]/10` (plan populaire)

## ❌ À Éviter

- ~~Gradients multicolores~~
- ~~Couleurs vives (orange, rose, bleu vif, etc.)~~
- ~~Backgrounds colorés~~

## ✅ À Utiliser

- Variations de gris/slate uniquement
- Purple (#8B5CF6) pour les accents importants
- Typographie SF Pro / -apple-system
- Espaces généreux (padding, margins)
- Borders fines (1-2px)
