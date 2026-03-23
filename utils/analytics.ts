export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

// Función para verificar si estamos en desarrollo
const isDevelopment = () => process.env.NODE_ENV === 'development';

// Función para enviar eventos a GTM a través de dataLayer
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  // Verificar si window y dataLayer están disponibles
  if (typeof window !== 'undefined') {
    // Inicializar dataLayer si no existe
    (window as any).dataLayer = (window as any).dataLayer || [];
    
    // Crear el objeto de evento para GTM
    const eventData = {
      event: eventName,
      ...parameters
    };
    
    // Log en desarrollo para debugging
    if (isDevelopment()) {
      console.log(`[DEV GTM Event]: ${eventName}`, eventData);
    }
    
    // Enviar evento al dataLayer
    (window as any).dataLayer.push(eventData);

    // Debug
    // console.log(`[PROD GTM Event]: ${eventName}`, eventData)
  }
};