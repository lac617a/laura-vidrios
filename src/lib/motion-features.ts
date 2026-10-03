// Funciones de Motion cargadas aparte (LazyMotion): no pesan en el bundle inicial.
// domMax incluye las animaciones de layout que reacomodan el grid al filtrar (solo el catálogo);
// el resto del sitio usa motion-features-basic.
export { domMax as default } from "motion/react";
