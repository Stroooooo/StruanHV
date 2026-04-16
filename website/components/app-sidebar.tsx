"use client"

import * as React from "react"
import {
  Server,
  ServerIcon,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"
import CreateServerWizard from "./wizards/create-server"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { venv } from "@/config/env"
import { Spinner } from "./ui/shadcn-io/spinner"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const auth: any = useContext(AuthContext)

  const {data, isLoading, isError} = useQuery({
        queryKey: ['teamlist'],
        queryFn: async () => {
            const res = await fetch(venv.SERVER + `/vm/teams`, {
                method: "GET",
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            return res.json()
        }
  })


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center mt-2">
          <Image
            alt="logo"
            src={venv.LOGO_URL}
            width={120}
            height={120}
            className="p-2 object-contain"
            unoptimized
          />
        </div>
        <div className="my-2 min-w-full border-t border-sidebar-border"></div>
        {
          isLoading ?
            <Spinner />
          :
            <TeamSwitcher teams={data} />
        }
        <CreateServerWizard />
      </SidebarHeader>
      <SidebarContent>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: auth["displayName"],
          email: auth["username"] + venv.EMAIL_DOMAIN,
          avatar: "",
          isAdmin: auth.isAdmin
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
