"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout({ children }) {
  return (
    <SidebarProvider className="min-h-screen">
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header> */}

        <main className="flex flex-col gap-4 p-4 pt-0 min-h-0 flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
