"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, ServerIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

export function TeamSwitcher({
  teams,
}: {
  teams: string[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = useState(teams?.[0])

  useEffect(() => {
    if (!teams || teams.length === 0) return
    const storedTeam = window.localStorage.getItem("@TEAM")
    const matched = storedTeam ? teams.filter(team => team[0] === storedTeam) : []
    const team = matched.length > 0 ? matched[0][0] : teams[0][0]

    setActiveTeam(team)
    window.localStorage.setItem("@TEAM", team)
  }, [teams])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ServerIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team[0]}
                onClick={() => {
                  setActiveTeam(team[0])
                  console.log(team[0])
                  window.localStorage.setItem("@TEAM", team[0])
                  window.location.reload()
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                 <ServerIcon className="size-3.5 shrink-0" />
                </div>
                {team[0]}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
