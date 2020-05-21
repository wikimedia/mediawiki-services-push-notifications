/** Types of messages we currently support */
export enum MessageType {
    CheckEchoV1 = 'checkEchoV1',
}

/** Generic message, independent of push vendor */
export class Message {
    messageType: MessageType
}

/** Message for targeting a single device */
export class SingleDeviceMessage extends Message {
    deviceToken: string;
}
