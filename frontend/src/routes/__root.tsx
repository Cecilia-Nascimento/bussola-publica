import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A rota acessada não existe nesta plataforma.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">Tente novamente ou volte para o início.</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
          <a href="/" className="rounded-md border border-border bg-card px-4 py-2 text-sm">Início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bússola Pública — Inteligência legislativa com IA" },
      { name: "description", content: "Plataforma de monitoramento de proposições, deputados e votações da Câmara, com classificação automática por IA." },
      { name: "author", content: "Bússola Pública" },
      { property: "og:title", content: "Bússola Pública — Inteligência legislativa com IA" },
      { property: "og:description", content: "Plataforma de monitoramento de proposições, deputados e votações da Câmara, com classificação automática por IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Bússola Pública — Inteligência legislativa com IA" },
      { name: "twitter:description", content: "Plataforma de monitoramento de proposições, deputados e votações da Câmara, com classificação automática por IA." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c9903f19-a890-46d6-8e91-12896d1bd36e/id-preview-36912060--bba68e0a-c14e-4a69-96c9-080953c53eb2.lovable.app-1780074635985.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c9903f19-a890-46d6-8e91-12896d1bd36e/id-preview-36912060--bba68e0a-c14e-4a69-96c9-080953c53eb2.lovable.app-1780074635985.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
                <SidebarTrigger />
                <div className="text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Câmara dos Deputados · </span>
                  Dados públicos · Atualizado semanalmente
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="hidden md:inline text-muted-foreground">v1.0 · Acadêmico</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                </div>
              </header>
              <main className="flex-1 p-4 md:p-8">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
