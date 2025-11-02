"use client";

import * as React from "react";
import { BookOpen, GalleryVerticalEnd, DollarSign, Users } from "lucide-react";

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
  teams: [
    {
      name: "Reborn Lombok",
      logo: GalleryVerticalEnd,
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      icon: GalleryVerticalEnd,
      url: "/dashboard",
    },
    {
      title: "Master Data",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "Paket Jasa",
          url: "/paket",
        },
        {
          title: "Armada",
          url: "/armada",
        },
        {
          title: "Sopir",
          url: "/sopir",
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
        {
          title: "Transaksi",
          url: "/transaksi",
        },
        {
          title: "Laporan",
          url: "/laporan",
        },
      ],
    },
    {
      title: "Manajemen User",
      icon: Users,
      url: "/users",
    },
  ],
};

export function AppSidebar({ ...props }) {
  const [user, setUser] = React.useState({
    name: "Loading...",
    email: "",
    avatar: "",
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const result = await res.json();
          // API returns { success: true, data: { user: {...} } }
          const userData = result.data?.user || result.data || result.user;

          if (userData) {
            setUser({
              name: userData.name || userData.username || "User",
              email: userData.email || "",
              avatar: userData.avatar || "",
              role: userData.role || "OPERATOR",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
