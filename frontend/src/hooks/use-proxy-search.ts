import { useState } from 'react'
import type { SearchConfig } from '@/types/proxy'

export function useProxySearch() {
    const [searchRaw, setSearchRaw] = useState("")
    const [searchActive, setSearchActive] = useState("")
    const [searchCfg, setSearchCfg] = useState<SearchConfig>({ 
        locations: ["all"],
        interactionScopes: ["all"],
        regex: false, 
        negative: false 
    })

    return {
        searchRaw, setSearchRaw,
        searchActive, setSearchActive,
        searchCfg, setSearchCfg
    }
}
