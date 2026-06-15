export namespace backend {
	
	export class CheckResult {
	    url: string;
	    ok: boolean;
	    latency: number;
	
	    static createFrom(source: any = {}) {
	        return new CheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.ok = source["ok"];
	        this.latency = source["latency"];
	    }
	}
	export class FuzzPayloadConfig {
	    type: string;
	    simpleText: string;
	    numFrom: number;
	    numTo: number;
	    numStep: number;
	    numBase: number;
	    numMinInt: number;
	    numMaxInt: number;
	    bruteMin: number;
	    bruteMax: number;
	    bruteCharset: string;
	    nullCount: number;
	
	    static createFrom(source: any = {}) {
	        return new FuzzPayloadConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.simpleText = source["simpleText"];
	        this.numFrom = source["numFrom"];
	        this.numTo = source["numTo"];
	        this.numStep = source["numStep"];
	        this.numBase = source["numBase"];
	        this.numMinInt = source["numMinInt"];
	        this.numMaxInt = source["numMaxInt"];
	        this.bruteMin = source["bruteMin"];
	        this.bruteMax = source["bruteMax"];
	        this.bruteCharset = source["bruteCharset"];
	        this.nullCount = source["nullCount"];
	    }
	}
	export class FuzzOptions {
	    session_id: string;
	    target_url: string;
	    raw_request: string;
	    payload_configs: FuzzPayloadConfig[];
	    attack_type: string;
	    fuzz_keyword: string;
	    threads: number;
	    timeout_ms: number;
	    delay_ms: number;
	
	    static createFrom(source: any = {}) {
	        return new FuzzOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.session_id = source["session_id"];
	        this.target_url = source["target_url"];
	        this.raw_request = source["raw_request"];
	        this.payload_configs = this.convertValues(source["payload_configs"], FuzzPayloadConfig);
	        this.attack_type = source["attack_type"];
	        this.fuzz_keyword = source["fuzz_keyword"];
	        this.threads = source["threads"];
	        this.timeout_ms = source["timeout_ms"];
	        this.delay_ms = source["delay_ms"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Rule {
	    id: string;
	    category: string;
	    name: string;
	    enabled: boolean;
	    type: string;
	    scope: string;
	    pattern: string;
	    replacement: string;
	    cel_expression: string;
	    color: string;
	    delay_ms: number;
	    visible: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Rule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.category = source["category"];
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	        this.type = source["type"];
	        this.scope = source["scope"];
	        this.pattern = source["pattern"];
	        this.replacement = source["replacement"];
	        this.cel_expression = source["cel_expression"];
	        this.color = source["color"];
	        this.delay_ms = source["delay_ms"];
	        this.visible = source["visible"];
	    }
	}
	export class ScopeRule {
	    id: number;
	    enabled: boolean;
	    type: string;
	    protocol: string;
	    host: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new ScopeRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.enabled = source["enabled"];
	        this.type = source["type"];
	        this.protocol = source["protocol"];
	        this.host = source["host"];
	        this.path = source["path"];
	    }
	}
	export class SpiderConfig {
	    url: string;
	    mode: string;
	    max_depth: number;
	
	    static createFrom(source: any = {}) {
	        return new SpiderConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.mode = source["mode"];
	        this.max_depth = source["max_depth"];
	    }
	}

}

