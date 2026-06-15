import { useState, useCallback } from 'react'
import type { Rule } from '@/types/proxy'
// @ts-ignore
import * as App from "@wailsjs/go/backend/App"

export function useProxyRules() {
    const [rules, setRules] = useState<Rule[]>([])

    const saveRules = useCallback(async (newRules: Rule[]) => {
        try {
            const res = await App.SaveRules(newRules)
            if (res === "Success") setRules(newRules)
        } catch (e) {
            console.error('Failed to save rules:', e)
        }
    }, [])

    return {
        rules,
        setRules,
        saveRules
    }
}
