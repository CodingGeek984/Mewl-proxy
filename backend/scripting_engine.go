package backend

import (
	"log"
	"github.com/dop251/goja"
)

type CustomScript struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Code        string `json:"code"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   string `json:"createdAt"`
}

var activeScripts []CustomScript

func (a *App) SaveCustomScripts(scripts []CustomScript) error {
	activeScripts = scripts
	log.Printf("[Scripting] Saved %d custom scripts", len(scripts))
	return nil
}

func RunScriptsOnRequest(reqRaw string) string {
	if len(activeScripts) == 0 {
		return reqRaw
	}
	for _, script := range activeScripts {
		if !script.Enabled {
			continue
		}
		vm := goja.New()
		_, err := vm.RunString(script.Code)
		if err != nil {
			log.Printf("[Scripting] Script parse error %s: %v", script.Name, err)
			continue
		}

		var onRequest func(string) string
		err = vm.ExportTo(vm.Get("onRequest"), &onRequest)
		if err == nil && onRequest != nil {
			reqRaw = onRequest(reqRaw)
		}
	}
	return reqRaw
}

func RunScriptsOnResponse(resRaw string) string {
	if len(activeScripts) == 0 {
		return resRaw
	}
	for _, script := range activeScripts {
		if !script.Enabled {
			continue
		}
		vm := goja.New()
		_, err := vm.RunString(script.Code)
		if err != nil {
			log.Printf("[Scripting] Script parse error %s: %v", script.Name, err)
			continue
		}

		var onResponse func(string) string
		err = vm.ExportTo(vm.Get("onResponse"), &onResponse)
		if err == nil && onResponse != nil {
			resRaw = onResponse(resRaw)
		}
	}
	return resRaw
}
