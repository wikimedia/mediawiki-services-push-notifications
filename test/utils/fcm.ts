/* This function creates a string payload for the FCM batch endpoint response */
export function createMultipartPayload(): string {
	const boundary = 'boundary';
	let payload = `--${boundary}\r\n`;
	payload += 'Content-type: application/http\r\n\r\n';
	payload += 'HTTP/1.1 200 OK\r\n';
	payload += 'Content-type: application/json\r\n\r\n';
	payload += '"{name:mock}"\r\n';
	payload += `--${boundary}--\r\n`;
	return payload;
}
