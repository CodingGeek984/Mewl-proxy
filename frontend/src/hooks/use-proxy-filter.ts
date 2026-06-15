import { useState } from 'react'
import type { FilterConfig } from '@/types/proxy'

const DEFAULT_FILTER: FilterConfig = {
    enabled: false,
    reqHasResponse: false,
    reqHasParams: false,
    mimeHtml: true, mimeImages: true, mimeCss: true, mimeJson: true, mimeOther: true,
    status2xx: true, status3xx: true, status4xx: true, status5xx: true,
    methodGet: true, methodPost: true, methodPut: true, methodDelete: true, methodOptions: true,
    hideExtensions: "",
    listenerPort: ""
}

export function useProxyFilter() {
    const [filterCfg, setFilterCfg] = useState<FilterConfig>(DEFAULT_FILTER)
    const [isFilterOnly, setIsFilterOnly] = useState(false)

    return {
        filterCfg, setFilterCfg,
        isFilterOnly, setIsFilterOnly
    }
}
