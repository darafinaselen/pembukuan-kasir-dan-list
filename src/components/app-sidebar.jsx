"use client";

import * as React from "react";
import { BookOpen, GalleryVerticalEnd, DollarSign } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Reborn Admin",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Master Data",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "Paket Jasa",
          url: "/packages",
        },
        {
          title: "Armada",
          url: "/cars",
        },
        {
          title: "Sopir",
          url: "/drivers",
        },
      ],
    },
    {
      title: "Laporan Keuangan",
      icon: DollarSign,
      isActive: false,
      items: [
        {
          title: "Pengeluaran",
          url: "/pengeluaran",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
