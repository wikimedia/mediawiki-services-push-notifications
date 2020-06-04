/** Types of messages we currently support */
export enum MessageType {
    CheckEchoV1 = 'checkEchoV1',
}

/** Generic message, independent of push vendor */
export class Message {
    messageType: MessageType
    dryRun?: boolean;
}

/** Message for targeting a single device */
export class MultiDeviceMessage extends Message {
    deviceTokens: Array<string>;
}
