import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { venv } from "@/config/env"
import { MonitorPlay } from "lucide-react"

export default function VmConnect({vmName}: any) {
    const {data} = useQuery({
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

    const [activeTeam, setActiveTeam] = useState<null | string>(null)

    useEffect(() => {
        if (data && data.length > 0) {
            const teamName = window.localStorage.getItem("@TEAM") || data[0][0]
            const matched = data.filter((team: string[]) => team[0] == teamName)
            const team = matched.length > 0 ? matched[0] : data[0]
            if (team) setActiveTeam(team[0])
        }
    }, [data])

    const openConsole = () => {
        if (!activeTeam) return
        const url = `/console?server=${encodeURIComponent(activeTeam)}&vm=${encodeURIComponent(vmName)}`
        window.open(url, '_blank')
    }

    return (
        <Button variant="default" onClick={openConsole} disabled={!activeTeam}>
            <MonitorPlay className="size-4 mr-1" />
            Console
        </Button>
    )
}
