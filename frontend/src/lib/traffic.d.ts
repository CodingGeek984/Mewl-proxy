import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace traffic. */
export namespace traffic {

    /** Properties of a TrafficEvent. */
    interface ITrafficEvent {

        /** TrafficEvent uid */
        uid?: (string|null);

        /** TrafficEvent id */
        id?: (number|null);

        /** TrafficEvent method */
        method?: (string|null);

        /** TrafficEvent host */
        host?: (string|null);

        /** TrafficEvent path */
        path?: (string|null);

        /** TrafficEvent query */
        query?: (string|null);

        /** TrafficEvent statusCode */
        statusCode?: (number|null);

        /** TrafficEvent size */
        size?: (number|Long|null);

        /** TrafficEvent requestSize */
        requestSize?: (number|Long|null);

        /** TrafficEvent latency */
        latency?: (number|null);

        /** TrafficEvent mimeType */
        mimeType?: (string|null);

        /** TrafficEvent tls */
        tls?: (boolean|null);

        /** TrafficEvent protocol */
        protocol?: (string|null);

        /** TrafficEvent lport */
        lport?: (number|null);

        /** TrafficEvent rport */
        rport?: (number|null);

        /** TrafficEvent sourceIp */
        sourceIp?: (string|null);

        /** TrafficEvent serverIp */
        serverIp?: (string|null);

        /** TrafficEvent hasCookie */
        hasCookie?: (boolean|null);

        /** TrafficEvent extension */
        extension?: (string|null);

        /** TrafficEvent source */
        source?: (string|null);

        /** TrafficEvent title */
        title?: (string|null);

        /** TrafficEvent tlsIssuer */
        tlsIssuer?: (string|null);

        /** TrafficEvent setCookies */
        setCookies?: (number|null);

        /** TrafficEvent requestRaw */
        requestRaw?: (string|null);

        /** TrafficEvent responseRaw */
        responseRaw?: (string|null);

        /** TrafficEvent time */
        time?: (string|null);

        /** TrafficEvent length */
        length?: (number|Long|null);

        /** TrafficEvent payloadRequestSize */
        payloadRequestSize?: (number|Long|null);

        /** TrafficEvent payloadResponseSize */
        payloadResponseSize?: (number|Long|null);

        /** TrafficEvent headersSize */
        headersSize?: (number|Long|null);

        /** TrafficEvent startTime */
        startTime?: (string|null);

        /** TrafficEvent endTime */
        endTime?: (string|null);

        /** TrafficEvent requestBody */
        requestBody?: (Uint8Array|null);

        /** TrafficEvent responseBody */
        responseBody?: (Uint8Array|null);
    }

    /** Represents a TrafficEvent. */
    class TrafficEvent implements ITrafficEvent {

        /**
         * Constructs a new TrafficEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: traffic.ITrafficEvent);

        /** TrafficEvent uid. */
        public uid: string;

        /** TrafficEvent id. */
        public id: number;

        /** TrafficEvent method. */
        public method: string;

        /** TrafficEvent host. */
        public host: string;

        /** TrafficEvent path. */
        public path: string;

        /** TrafficEvent query. */
        public query: string;

        /** TrafficEvent statusCode. */
        public statusCode: number;

        /** TrafficEvent size. */
        public size: (number|Long);

        /** TrafficEvent requestSize. */
        public requestSize: (number|Long);

        /** TrafficEvent latency. */
        public latency: number;

        /** TrafficEvent mimeType. */
        public mimeType: string;

        /** TrafficEvent tls. */
        public tls: boolean;

        /** TrafficEvent protocol. */
        public protocol: string;

        /** TrafficEvent lport. */
        public lport: number;

        /** TrafficEvent rport. */
        public rport: number;

        /** TrafficEvent sourceIp. */
        public sourceIp: string;

        /** TrafficEvent serverIp. */
        public serverIp: string;

        /** TrafficEvent hasCookie. */
        public hasCookie: boolean;

        /** TrafficEvent extension. */
        public extension: string;

        /** TrafficEvent source. */
        public source: string;

        /** TrafficEvent title. */
        public title: string;

        /** TrafficEvent tlsIssuer. */
        public tlsIssuer: string;

        /** TrafficEvent setCookies. */
        public setCookies: number;

        /** TrafficEvent requestRaw. */
        public requestRaw: string;

        /** TrafficEvent responseRaw. */
        public responseRaw: string;

        /** TrafficEvent time. */
        public time: string;

        /** TrafficEvent length. */
        public length: (number|Long);

        /** TrafficEvent payloadRequestSize. */
        public payloadRequestSize: (number|Long);

        /** TrafficEvent payloadResponseSize. */
        public payloadResponseSize: (number|Long);

        /** TrafficEvent headersSize. */
        public headersSize: (number|Long);

        /** TrafficEvent startTime. */
        public startTime: string;

        /** TrafficEvent endTime. */
        public endTime: string;

        /** TrafficEvent requestBody. */
        public requestBody: Uint8Array;

        /** TrafficEvent responseBody. */
        public responseBody: Uint8Array;

        /**
         * Creates a new TrafficEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TrafficEvent instance
         */
        public static create(properties?: traffic.ITrafficEvent): traffic.TrafficEvent;

        /**
         * Encodes the specified TrafficEvent message. Does not implicitly {@link traffic.TrafficEvent.verify|verify} messages.
         * @param message TrafficEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: traffic.ITrafficEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TrafficEvent message, length delimited. Does not implicitly {@link traffic.TrafficEvent.verify|verify} messages.
         * @param message TrafficEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: traffic.ITrafficEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TrafficEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TrafficEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): traffic.TrafficEvent;

        /**
         * Decodes a TrafficEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TrafficEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): traffic.TrafficEvent;

        /**
         * Verifies a TrafficEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TrafficEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TrafficEvent
         */
        public static fromObject(object: { [k: string]: any }): traffic.TrafficEvent;

        /**
         * Creates a plain object from a TrafficEvent message. Also converts values to other types if specified.
         * @param message TrafficEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: traffic.TrafficEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TrafficEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TrafficEvent
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ControlSignal. */
    interface IControlSignal {

        /** ControlSignal type */
        type?: (traffic.ControlSignal.Type|null);

        /** ControlSignal targetUid */
        targetUid?: (string|null);

        /** ControlSignal payload */
        payload?: (string|null);
    }

    /** Represents a ControlSignal. */
    class ControlSignal implements IControlSignal {

        /**
         * Constructs a new ControlSignal.
         * @param [properties] Properties to set
         */
        constructor(properties?: traffic.IControlSignal);

        /** ControlSignal type. */
        public type: traffic.ControlSignal.Type;

        /** ControlSignal targetUid. */
        public targetUid: string;

        /** ControlSignal payload. */
        public payload: string;

        /**
         * Creates a new ControlSignal instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ControlSignal instance
         */
        public static create(properties?: traffic.IControlSignal): traffic.ControlSignal;

        /**
         * Encodes the specified ControlSignal message. Does not implicitly {@link traffic.ControlSignal.verify|verify} messages.
         * @param message ControlSignal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: traffic.IControlSignal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ControlSignal message, length delimited. Does not implicitly {@link traffic.ControlSignal.verify|verify} messages.
         * @param message ControlSignal message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: traffic.IControlSignal, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ControlSignal message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ControlSignal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): traffic.ControlSignal;

        /**
         * Decodes a ControlSignal message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ControlSignal
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): traffic.ControlSignal;

        /**
         * Verifies a ControlSignal message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ControlSignal message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ControlSignal
         */
        public static fromObject(object: { [k: string]: any }): traffic.ControlSignal;

        /**
         * Creates a plain object from a ControlSignal message. Also converts values to other types if specified.
         * @param message ControlSignal
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: traffic.ControlSignal, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ControlSignal to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ControlSignal
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace ControlSignal {

        /** Type enum. */
        enum Type {
            INTERCEPT_ON = 0,
            INTERCEPT_OFF = 1,
            RELEASE_REQUEST = 2,
            DROP_REQUEST = 3
        }
    }

    /** Properties of a WSBatch. */
    interface IWSBatch {

        /** WSBatch events */
        events?: (traffic.ITrafficEvent[]|null);
    }

    /** Represents a WSBatch. */
    class WSBatch implements IWSBatch {

        /**
         * Constructs a new WSBatch.
         * @param [properties] Properties to set
         */
        constructor(properties?: traffic.IWSBatch);

        /** WSBatch events. */
        public events: traffic.ITrafficEvent[];

        /**
         * Creates a new WSBatch instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WSBatch instance
         */
        public static create(properties?: traffic.IWSBatch): traffic.WSBatch;

        /**
         * Encodes the specified WSBatch message. Does not implicitly {@link traffic.WSBatch.verify|verify} messages.
         * @param message WSBatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: traffic.IWSBatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WSBatch message, length delimited. Does not implicitly {@link traffic.WSBatch.verify|verify} messages.
         * @param message WSBatch message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: traffic.IWSBatch, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WSBatch message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WSBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): traffic.WSBatch;

        /**
         * Decodes a WSBatch message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WSBatch
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): traffic.WSBatch;

        /**
         * Verifies a WSBatch message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WSBatch message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WSBatch
         */
        public static fromObject(object: { [k: string]: any }): traffic.WSBatch;

        /**
         * Creates a plain object from a WSBatch message. Also converts values to other types if specified.
         * @param message WSBatch
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: traffic.WSBatch, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WSBatch to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for WSBatch
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
