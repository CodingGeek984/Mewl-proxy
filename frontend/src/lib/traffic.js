/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const traffic = $root.traffic = (() => {

    /**
     * Namespace traffic.
     * @exports traffic
     * @namespace
     */
    const traffic = {};

    traffic.TrafficEvent = (function() {

        /**
         * Properties of a TrafficEvent.
         * @memberof traffic
         * @interface ITrafficEvent
         * @property {string|null} [uid] TrafficEvent uid
         * @property {number|null} [id] TrafficEvent id
         * @property {string|null} [method] TrafficEvent method
         * @property {string|null} [host] TrafficEvent host
         * @property {string|null} [path] TrafficEvent path
         * @property {string|null} [query] TrafficEvent query
         * @property {number|null} [statusCode] TrafficEvent statusCode
         * @property {number|Long|null} [size] TrafficEvent size
         * @property {number|Long|null} [requestSize] TrafficEvent requestSize
         * @property {number|null} [latency] TrafficEvent latency
         * @property {string|null} [mimeType] TrafficEvent mimeType
         * @property {boolean|null} [tls] TrafficEvent tls
         * @property {string|null} [protocol] TrafficEvent protocol
         * @property {number|null} [lport] TrafficEvent lport
         * @property {number|null} [rport] TrafficEvent rport
         * @property {string|null} [sourceIp] TrafficEvent sourceIp
         * @property {string|null} [serverIp] TrafficEvent serverIp
         * @property {boolean|null} [hasCookie] TrafficEvent hasCookie
         * @property {string|null} [extension] TrafficEvent extension
         * @property {string|null} [source] TrafficEvent source
         * @property {string|null} [title] TrafficEvent title
         * @property {string|null} [tlsIssuer] TrafficEvent tlsIssuer
         * @property {number|null} [setCookies] TrafficEvent setCookies
         * @property {string|null} [requestRaw] TrafficEvent requestRaw
         * @property {string|null} [responseRaw] TrafficEvent responseRaw
         * @property {string|null} [time] TrafficEvent time
         * @property {number|Long|null} [length] TrafficEvent length
         * @property {number|Long|null} [payloadRequestSize] TrafficEvent payloadRequestSize
         * @property {number|Long|null} [payloadResponseSize] TrafficEvent payloadResponseSize
         * @property {number|Long|null} [headersSize] TrafficEvent headersSize
         * @property {string|null} [startTime] TrafficEvent startTime
         * @property {string|null} [endTime] TrafficEvent endTime
         * @property {Uint8Array|null} [requestBody] TrafficEvent requestBody
         * @property {Uint8Array|null} [responseBody] TrafficEvent responseBody
         */

        /**
         * Constructs a new TrafficEvent.
         * @memberof traffic
         * @classdesc Represents a TrafficEvent.
         * @implements ITrafficEvent
         * @constructor
         * @param {traffic.ITrafficEvent=} [properties] Properties to set
         */
        function TrafficEvent(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * TrafficEvent uid.
         * @member {string} uid
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.uid = "";

        /**
         * TrafficEvent id.
         * @member {number} id
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.id = 0;

        /**
         * TrafficEvent method.
         * @member {string} method
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.method = "";

        /**
         * TrafficEvent host.
         * @member {string} host
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.host = "";

        /**
         * TrafficEvent path.
         * @member {string} path
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.path = "";

        /**
         * TrafficEvent query.
         * @member {string} query
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.query = "";

        /**
         * TrafficEvent statusCode.
         * @member {number} statusCode
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.statusCode = 0;

        /**
         * TrafficEvent size.
         * @member {number|Long} size
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.size = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent requestSize.
         * @member {number|Long} requestSize
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.requestSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent latency.
         * @member {number} latency
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.latency = 0;

        /**
         * TrafficEvent mimeType.
         * @member {string} mimeType
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.mimeType = "";

        /**
         * TrafficEvent tls.
         * @member {boolean} tls
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.tls = false;

        /**
         * TrafficEvent protocol.
         * @member {string} protocol
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.protocol = "";

        /**
         * TrafficEvent lport.
         * @member {number} lport
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.lport = 0;

        /**
         * TrafficEvent rport.
         * @member {number} rport
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.rport = 0;

        /**
         * TrafficEvent sourceIp.
         * @member {string} sourceIp
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.sourceIp = "";

        /**
         * TrafficEvent serverIp.
         * @member {string} serverIp
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.serverIp = "";

        /**
         * TrafficEvent hasCookie.
         * @member {boolean} hasCookie
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.hasCookie = false;

        /**
         * TrafficEvent extension.
         * @member {string} extension
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.extension = "";

        /**
         * TrafficEvent source.
         * @member {string} source
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.source = "";

        /**
         * TrafficEvent title.
         * @member {string} title
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.title = "";

        /**
         * TrafficEvent tlsIssuer.
         * @member {string} tlsIssuer
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.tlsIssuer = "";

        /**
         * TrafficEvent setCookies.
         * @member {number} setCookies
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.setCookies = 0;

        /**
         * TrafficEvent requestRaw.
         * @member {string} requestRaw
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.requestRaw = "";

        /**
         * TrafficEvent responseRaw.
         * @member {string} responseRaw
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.responseRaw = "";

        /**
         * TrafficEvent time.
         * @member {string} time
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.time = "";

        /**
         * TrafficEvent length.
         * @member {number|Long} length
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.length = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent payloadRequestSize.
         * @member {number|Long} payloadRequestSize
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.payloadRequestSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent payloadResponseSize.
         * @member {number|Long} payloadResponseSize
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.payloadResponseSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent headersSize.
         * @member {number|Long} headersSize
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.headersSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * TrafficEvent startTime.
         * @member {string} startTime
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.startTime = "";

        /**
         * TrafficEvent endTime.
         * @member {string} endTime
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.endTime = "";

        /**
         * TrafficEvent requestBody.
         * @member {Uint8Array} requestBody
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.requestBody = $util.newBuffer([]);

        /**
         * TrafficEvent responseBody.
         * @member {Uint8Array} responseBody
         * @memberof traffic.TrafficEvent
         * @instance
         */
        TrafficEvent.prototype.responseBody = $util.newBuffer([]);

        /**
         * Creates a new TrafficEvent instance using the specified properties.
         * @function create
         * @memberof traffic.TrafficEvent
         * @static
         * @param {traffic.ITrafficEvent=} [properties] Properties to set
         * @returns {traffic.TrafficEvent} TrafficEvent instance
         */
        TrafficEvent.create = function create(properties) {
            return new TrafficEvent(properties);
        };

        /**
         * Encodes the specified TrafficEvent message. Does not implicitly {@link traffic.TrafficEvent.verify|verify} messages.
         * @function encode
         * @memberof traffic.TrafficEvent
         * @static
         * @param {traffic.ITrafficEvent} message TrafficEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrafficEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.uid);
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.id);
            if (message.method != null && Object.hasOwnProperty.call(message, "method"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.method);
            if (message.host != null && Object.hasOwnProperty.call(message, "host"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.host);
            if (message.path != null && Object.hasOwnProperty.call(message, "path"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.path);
            if (message.query != null && Object.hasOwnProperty.call(message, "query"))
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.query);
            if (message.statusCode != null && Object.hasOwnProperty.call(message, "statusCode"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.statusCode);
            if (message.size != null && Object.hasOwnProperty.call(message, "size"))
                writer.uint32(/* id 8, wireType 0 =*/64).int64(message.size);
            if (message.requestSize != null && Object.hasOwnProperty.call(message, "requestSize"))
                writer.uint32(/* id 9, wireType 0 =*/72).int64(message.requestSize);
            if (message.latency != null && Object.hasOwnProperty.call(message, "latency"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.latency);
            if (message.mimeType != null && Object.hasOwnProperty.call(message, "mimeType"))
                writer.uint32(/* id 11, wireType 2 =*/90).string(message.mimeType);
            if (message.tls != null && Object.hasOwnProperty.call(message, "tls"))
                writer.uint32(/* id 12, wireType 0 =*/96).bool(message.tls);
            if (message.protocol != null && Object.hasOwnProperty.call(message, "protocol"))
                writer.uint32(/* id 13, wireType 2 =*/106).string(message.protocol);
            if (message.lport != null && Object.hasOwnProperty.call(message, "lport"))
                writer.uint32(/* id 14, wireType 0 =*/112).int32(message.lport);
            if (message.rport != null && Object.hasOwnProperty.call(message, "rport"))
                writer.uint32(/* id 15, wireType 0 =*/120).int32(message.rport);
            if (message.sourceIp != null && Object.hasOwnProperty.call(message, "sourceIp"))
                writer.uint32(/* id 16, wireType 2 =*/130).string(message.sourceIp);
            if (message.serverIp != null && Object.hasOwnProperty.call(message, "serverIp"))
                writer.uint32(/* id 17, wireType 2 =*/138).string(message.serverIp);
            if (message.hasCookie != null && Object.hasOwnProperty.call(message, "hasCookie"))
                writer.uint32(/* id 18, wireType 0 =*/144).bool(message.hasCookie);
            if (message.extension != null && Object.hasOwnProperty.call(message, "extension"))
                writer.uint32(/* id 19, wireType 2 =*/154).string(message.extension);
            if (message.source != null && Object.hasOwnProperty.call(message, "source"))
                writer.uint32(/* id 20, wireType 2 =*/162).string(message.source);
            if (message.title != null && Object.hasOwnProperty.call(message, "title"))
                writer.uint32(/* id 21, wireType 2 =*/170).string(message.title);
            if (message.tlsIssuer != null && Object.hasOwnProperty.call(message, "tlsIssuer"))
                writer.uint32(/* id 22, wireType 2 =*/178).string(message.tlsIssuer);
            if (message.setCookies != null && Object.hasOwnProperty.call(message, "setCookies"))
                writer.uint32(/* id 23, wireType 0 =*/184).int32(message.setCookies);
            if (message.requestRaw != null && Object.hasOwnProperty.call(message, "requestRaw"))
                writer.uint32(/* id 24, wireType 2 =*/194).string(message.requestRaw);
            if (message.responseRaw != null && Object.hasOwnProperty.call(message, "responseRaw"))
                writer.uint32(/* id 25, wireType 2 =*/202).string(message.responseRaw);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                writer.uint32(/* id 26, wireType 2 =*/210).string(message.time);
            if (message.length != null && Object.hasOwnProperty.call(message, "length"))
                writer.uint32(/* id 27, wireType 0 =*/216).int64(message.length);
            if (message.payloadRequestSize != null && Object.hasOwnProperty.call(message, "payloadRequestSize"))
                writer.uint32(/* id 28, wireType 0 =*/224).int64(message.payloadRequestSize);
            if (message.payloadResponseSize != null && Object.hasOwnProperty.call(message, "payloadResponseSize"))
                writer.uint32(/* id 29, wireType 0 =*/232).int64(message.payloadResponseSize);
            if (message.headersSize != null && Object.hasOwnProperty.call(message, "headersSize"))
                writer.uint32(/* id 30, wireType 0 =*/240).int64(message.headersSize);
            if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
                writer.uint32(/* id 31, wireType 2 =*/250).string(message.startTime);
            if (message.endTime != null && Object.hasOwnProperty.call(message, "endTime"))
                writer.uint32(/* id 32, wireType 2 =*/258).string(message.endTime);
            if (message.requestBody != null && Object.hasOwnProperty.call(message, "requestBody"))
                writer.uint32(/* id 33, wireType 2 =*/266).bytes(message.requestBody);
            if (message.responseBody != null && Object.hasOwnProperty.call(message, "responseBody"))
                writer.uint32(/* id 34, wireType 2 =*/274).bytes(message.responseBody);
            return writer;
        };

        /**
         * Encodes the specified TrafficEvent message, length delimited. Does not implicitly {@link traffic.TrafficEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof traffic.TrafficEvent
         * @static
         * @param {traffic.ITrafficEvent} message TrafficEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrafficEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a TrafficEvent message from the specified reader or buffer.
         * @function decode
         * @memberof traffic.TrafficEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {traffic.TrafficEvent} TrafficEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrafficEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.traffic.TrafficEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.uid = reader.string();
                        break;
                    }
                case 2: {
                        message.id = reader.uint32();
                        break;
                    }
                case 3: {
                        message.method = reader.string();
                        break;
                    }
                case 4: {
                        message.host = reader.string();
                        break;
                    }
                case 5: {
                        message.path = reader.string();
                        break;
                    }
                case 6: {
                        message.query = reader.string();
                        break;
                    }
                case 7: {
                        message.statusCode = reader.int32();
                        break;
                    }
                case 8: {
                        message.size = reader.int64();
                        break;
                    }
                case 9: {
                        message.requestSize = reader.int64();
                        break;
                    }
                case 10: {
                        message.latency = reader.int32();
                        break;
                    }
                case 11: {
                        message.mimeType = reader.string();
                        break;
                    }
                case 12: {
                        message.tls = reader.bool();
                        break;
                    }
                case 13: {
                        message.protocol = reader.string();
                        break;
                    }
                case 14: {
                        message.lport = reader.int32();
                        break;
                    }
                case 15: {
                        message.rport = reader.int32();
                        break;
                    }
                case 16: {
                        message.sourceIp = reader.string();
                        break;
                    }
                case 17: {
                        message.serverIp = reader.string();
                        break;
                    }
                case 18: {
                        message.hasCookie = reader.bool();
                        break;
                    }
                case 19: {
                        message.extension = reader.string();
                        break;
                    }
                case 20: {
                        message.source = reader.string();
                        break;
                    }
                case 21: {
                        message.title = reader.string();
                        break;
                    }
                case 22: {
                        message.tlsIssuer = reader.string();
                        break;
                    }
                case 23: {
                        message.setCookies = reader.int32();
                        break;
                    }
                case 24: {
                        message.requestRaw = reader.string();
                        break;
                    }
                case 25: {
                        message.responseRaw = reader.string();
                        break;
                    }
                case 26: {
                        message.time = reader.string();
                        break;
                    }
                case 27: {
                        message.length = reader.int64();
                        break;
                    }
                case 28: {
                        message.payloadRequestSize = reader.int64();
                        break;
                    }
                case 29: {
                        message.payloadResponseSize = reader.int64();
                        break;
                    }
                case 30: {
                        message.headersSize = reader.int64();
                        break;
                    }
                case 31: {
                        message.startTime = reader.string();
                        break;
                    }
                case 32: {
                        message.endTime = reader.string();
                        break;
                    }
                case 33: {
                        message.requestBody = reader.bytes();
                        break;
                    }
                case 34: {
                        message.responseBody = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a TrafficEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof traffic.TrafficEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {traffic.TrafficEvent} TrafficEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrafficEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TrafficEvent message.
         * @function verify
         * @memberof traffic.TrafficEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TrafficEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.uid != null && message.hasOwnProperty("uid"))
                if (!$util.isString(message.uid))
                    return "uid: string expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.method != null && message.hasOwnProperty("method"))
                if (!$util.isString(message.method))
                    return "method: string expected";
            if (message.host != null && message.hasOwnProperty("host"))
                if (!$util.isString(message.host))
                    return "host: string expected";
            if (message.path != null && message.hasOwnProperty("path"))
                if (!$util.isString(message.path))
                    return "path: string expected";
            if (message.query != null && message.hasOwnProperty("query"))
                if (!$util.isString(message.query))
                    return "query: string expected";
            if (message.statusCode != null && message.hasOwnProperty("statusCode"))
                if (!$util.isInteger(message.statusCode))
                    return "statusCode: integer expected";
            if (message.size != null && message.hasOwnProperty("size"))
                if (!$util.isInteger(message.size) && !(message.size && $util.isInteger(message.size.low) && $util.isInteger(message.size.high)))
                    return "size: integer|Long expected";
            if (message.requestSize != null && message.hasOwnProperty("requestSize"))
                if (!$util.isInteger(message.requestSize) && !(message.requestSize && $util.isInteger(message.requestSize.low) && $util.isInteger(message.requestSize.high)))
                    return "requestSize: integer|Long expected";
            if (message.latency != null && message.hasOwnProperty("latency"))
                if (!$util.isInteger(message.latency))
                    return "latency: integer expected";
            if (message.mimeType != null && message.hasOwnProperty("mimeType"))
                if (!$util.isString(message.mimeType))
                    return "mimeType: string expected";
            if (message.tls != null && message.hasOwnProperty("tls"))
                if (typeof message.tls !== "boolean")
                    return "tls: boolean expected";
            if (message.protocol != null && message.hasOwnProperty("protocol"))
                if (!$util.isString(message.protocol))
                    return "protocol: string expected";
            if (message.lport != null && message.hasOwnProperty("lport"))
                if (!$util.isInteger(message.lport))
                    return "lport: integer expected";
            if (message.rport != null && message.hasOwnProperty("rport"))
                if (!$util.isInteger(message.rport))
                    return "rport: integer expected";
            if (message.sourceIp != null && message.hasOwnProperty("sourceIp"))
                if (!$util.isString(message.sourceIp))
                    return "sourceIp: string expected";
            if (message.serverIp != null && message.hasOwnProperty("serverIp"))
                if (!$util.isString(message.serverIp))
                    return "serverIp: string expected";
            if (message.hasCookie != null && message.hasOwnProperty("hasCookie"))
                if (typeof message.hasCookie !== "boolean")
                    return "hasCookie: boolean expected";
            if (message.extension != null && message.hasOwnProperty("extension"))
                if (!$util.isString(message.extension))
                    return "extension: string expected";
            if (message.source != null && message.hasOwnProperty("source"))
                if (!$util.isString(message.source))
                    return "source: string expected";
            if (message.title != null && message.hasOwnProperty("title"))
                if (!$util.isString(message.title))
                    return "title: string expected";
            if (message.tlsIssuer != null && message.hasOwnProperty("tlsIssuer"))
                if (!$util.isString(message.tlsIssuer))
                    return "tlsIssuer: string expected";
            if (message.setCookies != null && message.hasOwnProperty("setCookies"))
                if (!$util.isInteger(message.setCookies))
                    return "setCookies: integer expected";
            if (message.requestRaw != null && message.hasOwnProperty("requestRaw"))
                if (!$util.isString(message.requestRaw))
                    return "requestRaw: string expected";
            if (message.responseRaw != null && message.hasOwnProperty("responseRaw"))
                if (!$util.isString(message.responseRaw))
                    return "responseRaw: string expected";
            if (message.time != null && message.hasOwnProperty("time"))
                if (!$util.isString(message.time))
                    return "time: string expected";
            if (message.length != null && message.hasOwnProperty("length"))
                if (!$util.isInteger(message.length) && !(message.length && $util.isInteger(message.length.low) && $util.isInteger(message.length.high)))
                    return "length: integer|Long expected";
            if (message.payloadRequestSize != null && message.hasOwnProperty("payloadRequestSize"))
                if (!$util.isInteger(message.payloadRequestSize) && !(message.payloadRequestSize && $util.isInteger(message.payloadRequestSize.low) && $util.isInteger(message.payloadRequestSize.high)))
                    return "payloadRequestSize: integer|Long expected";
            if (message.payloadResponseSize != null && message.hasOwnProperty("payloadResponseSize"))
                if (!$util.isInteger(message.payloadResponseSize) && !(message.payloadResponseSize && $util.isInteger(message.payloadResponseSize.low) && $util.isInteger(message.payloadResponseSize.high)))
                    return "payloadResponseSize: integer|Long expected";
            if (message.headersSize != null && message.hasOwnProperty("headersSize"))
                if (!$util.isInteger(message.headersSize) && !(message.headersSize && $util.isInteger(message.headersSize.low) && $util.isInteger(message.headersSize.high)))
                    return "headersSize: integer|Long expected";
            if (message.startTime != null && message.hasOwnProperty("startTime"))
                if (!$util.isString(message.startTime))
                    return "startTime: string expected";
            if (message.endTime != null && message.hasOwnProperty("endTime"))
                if (!$util.isString(message.endTime))
                    return "endTime: string expected";
            if (message.requestBody != null && message.hasOwnProperty("requestBody"))
                if (!(message.requestBody && typeof message.requestBody.length === "number" || $util.isString(message.requestBody)))
                    return "requestBody: buffer expected";
            if (message.responseBody != null && message.hasOwnProperty("responseBody"))
                if (!(message.responseBody && typeof message.responseBody.length === "number" || $util.isString(message.responseBody)))
                    return "responseBody: buffer expected";
            return null;
        };

        /**
         * Creates a TrafficEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof traffic.TrafficEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {traffic.TrafficEvent} TrafficEvent
         */
        TrafficEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.traffic.TrafficEvent)
                return object;
            let message = new $root.traffic.TrafficEvent();
            if (object.uid != null)
                message.uid = String(object.uid);
            if (object.id != null)
                message.id = object.id >>> 0;
            if (object.method != null)
                message.method = String(object.method);
            if (object.host != null)
                message.host = String(object.host);
            if (object.path != null)
                message.path = String(object.path);
            if (object.query != null)
                message.query = String(object.query);
            if (object.statusCode != null)
                message.statusCode = object.statusCode | 0;
            if (object.size != null)
                if ($util.Long)
                    (message.size = $util.Long.fromValue(object.size)).unsigned = false;
                else if (typeof object.size === "string")
                    message.size = parseInt(object.size, 10);
                else if (typeof object.size === "number")
                    message.size = object.size;
                else if (typeof object.size === "object")
                    message.size = new $util.LongBits(object.size.low >>> 0, object.size.high >>> 0).toNumber();
            if (object.requestSize != null)
                if ($util.Long)
                    (message.requestSize = $util.Long.fromValue(object.requestSize)).unsigned = false;
                else if (typeof object.requestSize === "string")
                    message.requestSize = parseInt(object.requestSize, 10);
                else if (typeof object.requestSize === "number")
                    message.requestSize = object.requestSize;
                else if (typeof object.requestSize === "object")
                    message.requestSize = new $util.LongBits(object.requestSize.low >>> 0, object.requestSize.high >>> 0).toNumber();
            if (object.latency != null)
                message.latency = object.latency | 0;
            if (object.mimeType != null)
                message.mimeType = String(object.mimeType);
            if (object.tls != null)
                message.tls = Boolean(object.tls);
            if (object.protocol != null)
                message.protocol = String(object.protocol);
            if (object.lport != null)
                message.lport = object.lport | 0;
            if (object.rport != null)
                message.rport = object.rport | 0;
            if (object.sourceIp != null)
                message.sourceIp = String(object.sourceIp);
            if (object.serverIp != null)
                message.serverIp = String(object.serverIp);
            if (object.hasCookie != null)
                message.hasCookie = Boolean(object.hasCookie);
            if (object.extension != null)
                message.extension = String(object.extension);
            if (object.source != null)
                message.source = String(object.source);
            if (object.title != null)
                message.title = String(object.title);
            if (object.tlsIssuer != null)
                message.tlsIssuer = String(object.tlsIssuer);
            if (object.setCookies != null)
                message.setCookies = object.setCookies | 0;
            if (object.requestRaw != null)
                message.requestRaw = String(object.requestRaw);
            if (object.responseRaw != null)
                message.responseRaw = String(object.responseRaw);
            if (object.time != null)
                message.time = String(object.time);
            if (object.length != null)
                if ($util.Long)
                    (message.length = $util.Long.fromValue(object.length)).unsigned = false;
                else if (typeof object.length === "string")
                    message.length = parseInt(object.length, 10);
                else if (typeof object.length === "number")
                    message.length = object.length;
                else if (typeof object.length === "object")
                    message.length = new $util.LongBits(object.length.low >>> 0, object.length.high >>> 0).toNumber();
            if (object.payloadRequestSize != null)
                if ($util.Long)
                    (message.payloadRequestSize = $util.Long.fromValue(object.payloadRequestSize)).unsigned = false;
                else if (typeof object.payloadRequestSize === "string")
                    message.payloadRequestSize = parseInt(object.payloadRequestSize, 10);
                else if (typeof object.payloadRequestSize === "number")
                    message.payloadRequestSize = object.payloadRequestSize;
                else if (typeof object.payloadRequestSize === "object")
                    message.payloadRequestSize = new $util.LongBits(object.payloadRequestSize.low >>> 0, object.payloadRequestSize.high >>> 0).toNumber();
            if (object.payloadResponseSize != null)
                if ($util.Long)
                    (message.payloadResponseSize = $util.Long.fromValue(object.payloadResponseSize)).unsigned = false;
                else if (typeof object.payloadResponseSize === "string")
                    message.payloadResponseSize = parseInt(object.payloadResponseSize, 10);
                else if (typeof object.payloadResponseSize === "number")
                    message.payloadResponseSize = object.payloadResponseSize;
                else if (typeof object.payloadResponseSize === "object")
                    message.payloadResponseSize = new $util.LongBits(object.payloadResponseSize.low >>> 0, object.payloadResponseSize.high >>> 0).toNumber();
            if (object.headersSize != null)
                if ($util.Long)
                    (message.headersSize = $util.Long.fromValue(object.headersSize)).unsigned = false;
                else if (typeof object.headersSize === "string")
                    message.headersSize = parseInt(object.headersSize, 10);
                else if (typeof object.headersSize === "number")
                    message.headersSize = object.headersSize;
                else if (typeof object.headersSize === "object")
                    message.headersSize = new $util.LongBits(object.headersSize.low >>> 0, object.headersSize.high >>> 0).toNumber();
            if (object.startTime != null)
                message.startTime = String(object.startTime);
            if (object.endTime != null)
                message.endTime = String(object.endTime);
            if (object.requestBody != null)
                if (typeof object.requestBody === "string")
                    $util.base64.decode(object.requestBody, message.requestBody = $util.newBuffer($util.base64.length(object.requestBody)), 0);
                else if (object.requestBody.length >= 0)
                    message.requestBody = object.requestBody;
            if (object.responseBody != null)
                if (typeof object.responseBody === "string")
                    $util.base64.decode(object.responseBody, message.responseBody = $util.newBuffer($util.base64.length(object.responseBody)), 0);
                else if (object.responseBody.length >= 0)
                    message.responseBody = object.responseBody;
            return message;
        };

        /**
         * Creates a plain object from a TrafficEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof traffic.TrafficEvent
         * @static
         * @param {traffic.TrafficEvent} message TrafficEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TrafficEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.uid = "";
                object.id = 0;
                object.method = "";
                object.host = "";
                object.path = "";
                object.query = "";
                object.statusCode = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.size = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.size = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.requestSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.requestSize = options.longs === String ? "0" : 0;
                object.latency = 0;
                object.mimeType = "";
                object.tls = false;
                object.protocol = "";
                object.lport = 0;
                object.rport = 0;
                object.sourceIp = "";
                object.serverIp = "";
                object.hasCookie = false;
                object.extension = "";
                object.source = "";
                object.title = "";
                object.tlsIssuer = "";
                object.setCookies = 0;
                object.requestRaw = "";
                object.responseRaw = "";
                object.time = "";
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.length = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.length = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.payloadRequestSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.payloadRequestSize = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.payloadResponseSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.payloadResponseSize = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, false);
                    object.headersSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.headersSize = options.longs === String ? "0" : 0;
                object.startTime = "";
                object.endTime = "";
                if (options.bytes === String)
                    object.requestBody = "";
                else {
                    object.requestBody = [];
                    if (options.bytes !== Array)
                        object.requestBody = $util.newBuffer(object.requestBody);
                }
                if (options.bytes === String)
                    object.responseBody = "";
                else {
                    object.responseBody = [];
                    if (options.bytes !== Array)
                        object.responseBody = $util.newBuffer(object.responseBody);
                }
            }
            if (message.uid != null && message.hasOwnProperty("uid"))
                object.uid = message.uid;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.method != null && message.hasOwnProperty("method"))
                object.method = message.method;
            if (message.host != null && message.hasOwnProperty("host"))
                object.host = message.host;
            if (message.path != null && message.hasOwnProperty("path"))
                object.path = message.path;
            if (message.query != null && message.hasOwnProperty("query"))
                object.query = message.query;
            if (message.statusCode != null && message.hasOwnProperty("statusCode"))
                object.statusCode = message.statusCode;
            if (message.size != null && message.hasOwnProperty("size"))
                if (typeof message.size === "number")
                    object.size = options.longs === String ? String(message.size) : message.size;
                else
                    object.size = options.longs === String ? $util.Long.prototype.toString.call(message.size) : options.longs === Number ? new $util.LongBits(message.size.low >>> 0, message.size.high >>> 0).toNumber() : message.size;
            if (message.requestSize != null && message.hasOwnProperty("requestSize"))
                if (typeof message.requestSize === "number")
                    object.requestSize = options.longs === String ? String(message.requestSize) : message.requestSize;
                else
                    object.requestSize = options.longs === String ? $util.Long.prototype.toString.call(message.requestSize) : options.longs === Number ? new $util.LongBits(message.requestSize.low >>> 0, message.requestSize.high >>> 0).toNumber() : message.requestSize;
            if (message.latency != null && message.hasOwnProperty("latency"))
                object.latency = message.latency;
            if (message.mimeType != null && message.hasOwnProperty("mimeType"))
                object.mimeType = message.mimeType;
            if (message.tls != null && message.hasOwnProperty("tls"))
                object.tls = message.tls;
            if (message.protocol != null && message.hasOwnProperty("protocol"))
                object.protocol = message.protocol;
            if (message.lport != null && message.hasOwnProperty("lport"))
                object.lport = message.lport;
            if (message.rport != null && message.hasOwnProperty("rport"))
                object.rport = message.rport;
            if (message.sourceIp != null && message.hasOwnProperty("sourceIp"))
                object.sourceIp = message.sourceIp;
            if (message.serverIp != null && message.hasOwnProperty("serverIp"))
                object.serverIp = message.serverIp;
            if (message.hasCookie != null && message.hasOwnProperty("hasCookie"))
                object.hasCookie = message.hasCookie;
            if (message.extension != null && message.hasOwnProperty("extension"))
                object.extension = message.extension;
            if (message.source != null && message.hasOwnProperty("source"))
                object.source = message.source;
            if (message.title != null && message.hasOwnProperty("title"))
                object.title = message.title;
            if (message.tlsIssuer != null && message.hasOwnProperty("tlsIssuer"))
                object.tlsIssuer = message.tlsIssuer;
            if (message.setCookies != null && message.hasOwnProperty("setCookies"))
                object.setCookies = message.setCookies;
            if (message.requestRaw != null && message.hasOwnProperty("requestRaw"))
                object.requestRaw = message.requestRaw;
            if (message.responseRaw != null && message.hasOwnProperty("responseRaw"))
                object.responseRaw = message.responseRaw;
            if (message.time != null && message.hasOwnProperty("time"))
                object.time = message.time;
            if (message.length != null && message.hasOwnProperty("length"))
                if (typeof message.length === "number")
                    object.length = options.longs === String ? String(message.length) : message.length;
                else
                    object.length = options.longs === String ? $util.Long.prototype.toString.call(message.length) : options.longs === Number ? new $util.LongBits(message.length.low >>> 0, message.length.high >>> 0).toNumber() : message.length;
            if (message.payloadRequestSize != null && message.hasOwnProperty("payloadRequestSize"))
                if (typeof message.payloadRequestSize === "number")
                    object.payloadRequestSize = options.longs === String ? String(message.payloadRequestSize) : message.payloadRequestSize;
                else
                    object.payloadRequestSize = options.longs === String ? $util.Long.prototype.toString.call(message.payloadRequestSize) : options.longs === Number ? new $util.LongBits(message.payloadRequestSize.low >>> 0, message.payloadRequestSize.high >>> 0).toNumber() : message.payloadRequestSize;
            if (message.payloadResponseSize != null && message.hasOwnProperty("payloadResponseSize"))
                if (typeof message.payloadResponseSize === "number")
                    object.payloadResponseSize = options.longs === String ? String(message.payloadResponseSize) : message.payloadResponseSize;
                else
                    object.payloadResponseSize = options.longs === String ? $util.Long.prototype.toString.call(message.payloadResponseSize) : options.longs === Number ? new $util.LongBits(message.payloadResponseSize.low >>> 0, message.payloadResponseSize.high >>> 0).toNumber() : message.payloadResponseSize;
            if (message.headersSize != null && message.hasOwnProperty("headersSize"))
                if (typeof message.headersSize === "number")
                    object.headersSize = options.longs === String ? String(message.headersSize) : message.headersSize;
                else
                    object.headersSize = options.longs === String ? $util.Long.prototype.toString.call(message.headersSize) : options.longs === Number ? new $util.LongBits(message.headersSize.low >>> 0, message.headersSize.high >>> 0).toNumber() : message.headersSize;
            if (message.startTime != null && message.hasOwnProperty("startTime"))
                object.startTime = message.startTime;
            if (message.endTime != null && message.hasOwnProperty("endTime"))
                object.endTime = message.endTime;
            if (message.requestBody != null && message.hasOwnProperty("requestBody"))
                object.requestBody = options.bytes === String ? $util.base64.encode(message.requestBody, 0, message.requestBody.length) : options.bytes === Array ? Array.prototype.slice.call(message.requestBody) : message.requestBody;
            if (message.responseBody != null && message.hasOwnProperty("responseBody"))
                object.responseBody = options.bytes === String ? $util.base64.encode(message.responseBody, 0, message.responseBody.length) : options.bytes === Array ? Array.prototype.slice.call(message.responseBody) : message.responseBody;
            return object;
        };

        /**
         * Converts this TrafficEvent to JSON.
         * @function toJSON
         * @memberof traffic.TrafficEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TrafficEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for TrafficEvent
         * @function getTypeUrl
         * @memberof traffic.TrafficEvent
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        TrafficEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/traffic.TrafficEvent";
        };

        return TrafficEvent;
    })();

    traffic.ControlSignal = (function() {

        /**
         * Properties of a ControlSignal.
         * @memberof traffic
         * @interface IControlSignal
         * @property {traffic.ControlSignal.Type|null} [type] ControlSignal type
         * @property {string|null} [targetUid] ControlSignal targetUid
         * @property {string|null} [payload] ControlSignal payload
         */

        /**
         * Constructs a new ControlSignal.
         * @memberof traffic
         * @classdesc Represents a ControlSignal.
         * @implements IControlSignal
         * @constructor
         * @param {traffic.IControlSignal=} [properties] Properties to set
         */
        function ControlSignal(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ControlSignal type.
         * @member {traffic.ControlSignal.Type} type
         * @memberof traffic.ControlSignal
         * @instance
         */
        ControlSignal.prototype.type = 0;

        /**
         * ControlSignal targetUid.
         * @member {string} targetUid
         * @memberof traffic.ControlSignal
         * @instance
         */
        ControlSignal.prototype.targetUid = "";

        /**
         * ControlSignal payload.
         * @member {string} payload
         * @memberof traffic.ControlSignal
         * @instance
         */
        ControlSignal.prototype.payload = "";

        /**
         * Creates a new ControlSignal instance using the specified properties.
         * @function create
         * @memberof traffic.ControlSignal
         * @static
         * @param {traffic.IControlSignal=} [properties] Properties to set
         * @returns {traffic.ControlSignal} ControlSignal instance
         */
        ControlSignal.create = function create(properties) {
            return new ControlSignal(properties);
        };

        /**
         * Encodes the specified ControlSignal message. Does not implicitly {@link traffic.ControlSignal.verify|verify} messages.
         * @function encode
         * @memberof traffic.ControlSignal
         * @static
         * @param {traffic.IControlSignal} message ControlSignal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ControlSignal.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            if (message.targetUid != null && Object.hasOwnProperty.call(message, "targetUid"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.targetUid);
            if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.payload);
            return writer;
        };

        /**
         * Encodes the specified ControlSignal message, length delimited. Does not implicitly {@link traffic.ControlSignal.verify|verify} messages.
         * @function encodeDelimited
         * @memberof traffic.ControlSignal
         * @static
         * @param {traffic.IControlSignal} message ControlSignal message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ControlSignal.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ControlSignal message from the specified reader or buffer.
         * @function decode
         * @memberof traffic.ControlSignal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {traffic.ControlSignal} ControlSignal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ControlSignal.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.traffic.ControlSignal();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.type = reader.int32();
                        break;
                    }
                case 2: {
                        message.targetUid = reader.string();
                        break;
                    }
                case 3: {
                        message.payload = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ControlSignal message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof traffic.ControlSignal
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {traffic.ControlSignal} ControlSignal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ControlSignal.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ControlSignal message.
         * @function verify
         * @memberof traffic.ControlSignal
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ControlSignal.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            if (message.targetUid != null && message.hasOwnProperty("targetUid"))
                if (!$util.isString(message.targetUid))
                    return "targetUid: string expected";
            if (message.payload != null && message.hasOwnProperty("payload"))
                if (!$util.isString(message.payload))
                    return "payload: string expected";
            return null;
        };

        /**
         * Creates a ControlSignal message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof traffic.ControlSignal
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {traffic.ControlSignal} ControlSignal
         */
        ControlSignal.fromObject = function fromObject(object) {
            if (object instanceof $root.traffic.ControlSignal)
                return object;
            let message = new $root.traffic.ControlSignal();
            switch (object.type) {
            default:
                if (typeof object.type === "number") {
                    message.type = object.type;
                    break;
                }
                break;
            case "INTERCEPT_ON":
            case 0:
                message.type = 0;
                break;
            case "INTERCEPT_OFF":
            case 1:
                message.type = 1;
                break;
            case "RELEASE_REQUEST":
            case 2:
                message.type = 2;
                break;
            case "DROP_REQUEST":
            case 3:
                message.type = 3;
                break;
            }
            if (object.targetUid != null)
                message.targetUid = String(object.targetUid);
            if (object.payload != null)
                message.payload = String(object.payload);
            return message;
        };

        /**
         * Creates a plain object from a ControlSignal message. Also converts values to other types if specified.
         * @function toObject
         * @memberof traffic.ControlSignal
         * @static
         * @param {traffic.ControlSignal} message ControlSignal
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ControlSignal.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.type = options.enums === String ? "INTERCEPT_ON" : 0;
                object.targetUid = "";
                object.payload = "";
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.traffic.ControlSignal.Type[message.type] === undefined ? message.type : $root.traffic.ControlSignal.Type[message.type] : message.type;
            if (message.targetUid != null && message.hasOwnProperty("targetUid"))
                object.targetUid = message.targetUid;
            if (message.payload != null && message.hasOwnProperty("payload"))
                object.payload = message.payload;
            return object;
        };

        /**
         * Converts this ControlSignal to JSON.
         * @function toJSON
         * @memberof traffic.ControlSignal
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ControlSignal.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ControlSignal
         * @function getTypeUrl
         * @memberof traffic.ControlSignal
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ControlSignal.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/traffic.ControlSignal";
        };

        /**
         * Type enum.
         * @name traffic.ControlSignal.Type
         * @enum {number}
         * @property {number} INTERCEPT_ON=0 INTERCEPT_ON value
         * @property {number} INTERCEPT_OFF=1 INTERCEPT_OFF value
         * @property {number} RELEASE_REQUEST=2 RELEASE_REQUEST value
         * @property {number} DROP_REQUEST=3 DROP_REQUEST value
         */
        ControlSignal.Type = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "INTERCEPT_ON"] = 0;
            values[valuesById[1] = "INTERCEPT_OFF"] = 1;
            values[valuesById[2] = "RELEASE_REQUEST"] = 2;
            values[valuesById[3] = "DROP_REQUEST"] = 3;
            return values;
        })();

        return ControlSignal;
    })();

    traffic.WSBatch = (function() {

        /**
         * Properties of a WSBatch.
         * @memberof traffic
         * @interface IWSBatch
         * @property {Array.<traffic.ITrafficEvent>|null} [events] WSBatch events
         */

        /**
         * Constructs a new WSBatch.
         * @memberof traffic
         * @classdesc Represents a WSBatch.
         * @implements IWSBatch
         * @constructor
         * @param {traffic.IWSBatch=} [properties] Properties to set
         */
        function WSBatch(properties) {
            this.events = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * WSBatch events.
         * @member {Array.<traffic.ITrafficEvent>} events
         * @memberof traffic.WSBatch
         * @instance
         */
        WSBatch.prototype.events = $util.emptyArray;

        /**
         * Creates a new WSBatch instance using the specified properties.
         * @function create
         * @memberof traffic.WSBatch
         * @static
         * @param {traffic.IWSBatch=} [properties] Properties to set
         * @returns {traffic.WSBatch} WSBatch instance
         */
        WSBatch.create = function create(properties) {
            return new WSBatch(properties);
        };

        /**
         * Encodes the specified WSBatch message. Does not implicitly {@link traffic.WSBatch.verify|verify} messages.
         * @function encode
         * @memberof traffic.WSBatch
         * @static
         * @param {traffic.IWSBatch} message WSBatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WSBatch.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.events != null && message.events.length)
                for (let i = 0; i < message.events.length; ++i)
                    $root.traffic.TrafficEvent.encode(message.events[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified WSBatch message, length delimited. Does not implicitly {@link traffic.WSBatch.verify|verify} messages.
         * @function encodeDelimited
         * @memberof traffic.WSBatch
         * @static
         * @param {traffic.IWSBatch} message WSBatch message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WSBatch.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a WSBatch message from the specified reader or buffer.
         * @function decode
         * @memberof traffic.WSBatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {traffic.WSBatch} WSBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WSBatch.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.traffic.WSBatch();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.events && message.events.length))
                            message.events = [];
                        message.events.push($root.traffic.TrafficEvent.decode(reader, reader.uint32()));
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a WSBatch message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof traffic.WSBatch
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {traffic.WSBatch} WSBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WSBatch.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WSBatch message.
         * @function verify
         * @memberof traffic.WSBatch
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WSBatch.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.events != null && message.hasOwnProperty("events")) {
                if (!Array.isArray(message.events))
                    return "events: array expected";
                for (let i = 0; i < message.events.length; ++i) {
                    let error = $root.traffic.TrafficEvent.verify(message.events[i]);
                    if (error)
                        return "events." + error;
                }
            }
            return null;
        };

        /**
         * Creates a WSBatch message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof traffic.WSBatch
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {traffic.WSBatch} WSBatch
         */
        WSBatch.fromObject = function fromObject(object) {
            if (object instanceof $root.traffic.WSBatch)
                return object;
            let message = new $root.traffic.WSBatch();
            if (object.events) {
                if (!Array.isArray(object.events))
                    throw TypeError(".traffic.WSBatch.events: array expected");
                message.events = [];
                for (let i = 0; i < object.events.length; ++i) {
                    if (typeof object.events[i] !== "object")
                        throw TypeError(".traffic.WSBatch.events: object expected");
                    message.events[i] = $root.traffic.TrafficEvent.fromObject(object.events[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a WSBatch message. Also converts values to other types if specified.
         * @function toObject
         * @memberof traffic.WSBatch
         * @static
         * @param {traffic.WSBatch} message WSBatch
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WSBatch.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.events = [];
            if (message.events && message.events.length) {
                object.events = [];
                for (let j = 0; j < message.events.length; ++j)
                    object.events[j] = $root.traffic.TrafficEvent.toObject(message.events[j], options);
            }
            return object;
        };

        /**
         * Converts this WSBatch to JSON.
         * @function toJSON
         * @memberof traffic.WSBatch
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WSBatch.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for WSBatch
         * @function getTypeUrl
         * @memberof traffic.WSBatch
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        WSBatch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/traffic.WSBatch";
        };

        return WSBatch;
    })();

    return traffic;
})();

export { $root as default };
