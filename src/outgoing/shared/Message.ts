/** Types of messages we currently support */
export enum MessageType {
    CheckEchoV1 = 'checkEchoV1',
}

export enum PushProvider {
    APNS = 'apns',
    FCM = 'fcm'
}

export interface MessageMeta {
    topic?: string;
}

/** Generic message */
export class Message {
    provider: PushProvider;
    type: MessageType;
    meta: MessageMeta;
    dryRun?: boolean;
    enqueueTimestamp?: number;

    constructor(provider: PushProvider, type: MessageType, meta: MessageMeta, dryRun?: boolean) {
        this.provider = provider;
        this.type = type;
        this.dryRun = dryRun;
        this.meta = meta;
    }
}

/** Message targeting a single device */
export class SingleDeviceMessage extends Message {
    deviceToken: string;

    constructor(
        deviceToken: string,
        provider: PushProvider,
        type: MessageType,
        meta: MessageMeta,
        dryRun?: boolean,
    ) {
        super(provider, type, meta, dryRun);
        this.deviceToken = deviceToken;
    }
}

/** Message targeting multiple devices */
export class MultiDeviceMessage extends Message {
    deviceTokens: Set<string>;

    constructor(
        deviceTokens: Set<string>,
        provider: PushProvider,
        type: MessageType,
        meta: MessageMeta,
        dryRun?: boolean
    ) {
        super(provider, type, meta, dryRun);
        this.deviceTokens = deviceTokens;
    }

    /**
     * Split a MultiDeviceMessage into separate SingleDeviceMessages for each device token.
     * @return {!Array<SingleDeviceMessage>}
     */
    public toSingleDeviceMessages(): Array<SingleDeviceMessage> {
        return [...this.deviceTokens].map((token) => {
            return new SingleDeviceMessage(token, this.provider, this.type, this.meta, this.dryRun);
        });
    }
}
