import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Workflow,
  Database,
  Sparkles,
  FileText,
  Users,
  Cog,
  MessageSquare,
  Presentation,
  Compass,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Proposições", url: "/proposicoes", icon: FileText },
  { title: "Deputados", url: "/deputados", icon: Users },
  { title: "Chatbot IA", url: "/chatbot", icon: MessageSquare },
];

const techItems = [
  { title: "Pipeline", url: "/pipeline", icon: Workflow },
  { title: "Modelo de Dados", url: "/modelo-dados", icon: Database },
  { title: "Camada de IA", url: "/ia", icon: Sparkles },
  { title: "Automação n8n", url: "/automacao", icon: Cog },
];

const docItems = [
  { title: "Apresentação", url: "/apresentacao", icon: Presentation },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Bússola Pública</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Legislative AI
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Engenharia", techItems)}
        {renderGroup("Projeto", docItems)}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Pipeline online · v1.0
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
