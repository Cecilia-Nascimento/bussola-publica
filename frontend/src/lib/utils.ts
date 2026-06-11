// Arquivo reconstruido: o helper padrao do shadcn/ui nao estava versionado no
// repositorio. Combina classes condicionais (clsx) e resolve conflitos do
// Tailwind (tailwind-merge). Usado por todos os componentes de UI.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
