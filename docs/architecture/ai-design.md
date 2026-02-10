# Engunity AI // Design System & Frontend Architecture

This document outlines the design philosophy, theme specifications, and frontend implementation patterns for the Engunity AI platform.

## 1. Design Philosophy
**"Intelligent Restraint"**
The interface is designed for deep work, professional research, and clinical precision. It avoids unnecessary decoration, focusing on legibility, spatial organization, and a "High-Tech / Low-Light" aesthetic.

---

## 2. Color Palette: "The Void & Starlight"

### Base Tones (The Void)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `void-900` | `#030712` | Main Background (Pure darkness) |
| `void-800` | `#0B1121` | Surface/Panel Background |
| `void-700` | `#151E32` | Elevated Components / Strokes |

### Typography (Starlight)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `starlight-100` | `#E2E8F0` | Primary Headings & High Emphasis |
| `starlight-400` | `#94A3B8` | Body Text & Secondary Information |

### Accents (Cyber Radiance)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `cyber-teal` | `#2DD4BF` | Primary Action / Active States |
| `cyber-sky` | `#0EA5E9` | Secondary Accents / Link Hover |
| `neon-cyan` | `#06B6D4` | Decorative Gradients |
| `neon-teal` | `#22D3EE` | Glow Effects |

---

## 3. Typography

### Typefaces
- **Sans-Serif**: `Inter` (Variable weight) - Used for primary interface elements and readability.
- **Monospace**: `JetBrains Mono` - Used for data, status indicators, code blocks, and system labels.

### Type Scale
- **H1**: `clamp(2rem, 5vw, 3.125rem)` // Font-black // 1.1 Line-height
- **H2**: `clamp(1.5rem, 4vw, 2rem)` // Font-bold // 1.2 Line-height
- **Body Large**: `1.125rem` (18px) // 1.6 Line-height
- **Body Standard**: `1rem` (16px) // 1.6 Line-height
- **Mono Label**: `0.75rem` (12px) // Letter-spacing: 0.2em // Uppercase

---

## 4. Component Architecture

### Glassmorphism
The platform uses a "Glass" system to create depth without sacrificing the dark theme.
- **`.glass-panel`**: `bg-void-800/70` with `backdrop-blur-md` and a subtle `white/10` border.
- **`.glass-card`**: Interactive panel that elevates on hover with a `cyber-teal` glow and shadow.

### Buttons
- **`btn-reactor`**: High-contrast gradient button (`cyber-teal` to `cyber-sky`). Features a shadow glow.
- **`btn-ghost`**: Subtle outline button for secondary actions.

---

## 5. Layout & Grid
- **Global Container**: `.container-atlas` (Max-width: 1720px).
- **Sidebar**: Fixed 72px (18rem) navigation for the dashboard.
- **Spacing Unit**: 8px baseline.

---

## 6. Motion & Physics
Engunity utilizes a **"Linear Drift"** animation style.
- **`animate-in`**: A custom `fade-in-up` transition using `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Pulses**: Status indicators use subtle `animate-pulse` to signify active neural links.

---

## 7. Frontend Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Images**: Next/Image (Optimized)
