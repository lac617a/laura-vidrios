import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false en el servidor y al hidratar; true después. Para lo que depende del navegador
 * (localStorage, por ejemplo) sin setState en un efecto ni diferencias de hidratación.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
