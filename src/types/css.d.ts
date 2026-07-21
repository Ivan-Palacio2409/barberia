// ============================================================
// css.d.ts
//
// Corrige: "Cannot find module or type declarations for
// side-effect import of './globals.css'." ts(2882) en
// src/app/layout.tsx.
//
// TypeScript, con moduleResolution: "bundler", exige poder
// resolver algun tipo de declaracion para CADA import — incluso
// uno "side-effect" como `import './globals.css'` que no importa
// ningun valor. Next.js soporta importar CSS en tiempo de build
// (vía su loader de Webpack/Turbopack), pero eso no le dice nada
// al *compilador* de TypeScript: sin una declaracion ambiente
// para el patron '*.css', el checker no encuentra un módulo (ni
// sus tipos) que corresponda a ese import y lo marca como error,
// aunque el proyecto compile y corra bien en runtime.
//
// Esta declaracion le dice a TS "cualquier import que termine en
// .css es un módulo válido, sin exports tipados" — es el fix
// estándar para este error en proyectos Next.js/TypeScript, y no
// depende de si node_modules está completo o no (no es un
// problema de instalación).
// ============================================================

declare module '*.css'