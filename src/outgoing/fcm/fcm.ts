import * as admin from 'firebase-admin';
import messaging = admin.messaging;
import prometheusClient from 'prom-client';
import { MultiDeviceMessage } from '../shared/Message';
import MulticastMessage = messaging.MulticastMessage;
import BatchResponse = messaging.BatchResponse;
import { Application } from 'express';

export function init(app: Application): void {
	if (!admin.apps.length) {
		const httpAgent = app.conf && app.conf.proxyAgent;
		admin.initializeApp({
			credential: admin.credential.applicationDefault(httpAgent),
			httpAgent
		});
	}
}

export async function sendMessage(app: Application, message: MulticastMessage, dryRun?: boolean):
    Promise<BatchResponse> {
	const transactionStart = Date.now();
	const fcmFailureMetric = app.metrics.makeMetric({
		type: 'Counter',
		name: 'FCMSendFailure',
		prometheus: {
			name: 'push_notifications_fcm_send_failure',
			help: 'Count of failed FCM notifications sent'
		}
	});

	let response: BatchResponse;

	try {
		response = await admin.messaging().sendMulticast(message, dryRun);
	} catch (err) {
		fcmFailureMetric.increment(message.tokens.length);
		throw err;
	}

	app.logger.log('debug/fcm', `Successfully sent ${response.successCount} messages; ` +
        `${response.failureCount} messages failed`);

	app.metrics.makeMetric({
		type: 'Histogram',
		name: 'FCMTransactionTiming',
		prometheus: {
			name: 'push_notifications_fcm_transaction_histogram',
			help: 'Time spent on a transaction with the FCM service',
			buckets: prometheusClient.exponentialBuckets(0.005, 2, 15)
		}
	}).observe(Date.now() - transactionStart);

	let successCount = response.successCount;
	if (successCount === null || successCount === undefined) {
		successCount = 0;
	}
	app.metrics.makeMetric({
		type: 'Counter',
		name: 'FCMSendSuccess',
		prometheus: {
			name: 'push_notifications_fcm_send_success',
			help: 'Count of successful FCM notifications sent'
		}
	}).increment(successCount);

	let failureCount = response.failureCount;
	if (failureCount === null || failureCount === undefined) {
		failureCount = 0;
	}
	fcmFailureMetric.increment(failureCount);

	return response;
}

export function getMulticastMessage(message: MultiDeviceMessage): MulticastMessage {
	return {
		tokens: [...message.deviceTokens],
		data: {
			type: message.type
		},
		android: {
			collapseKey: message.type
		}
	};
}

export function getFailedTokens(message: MulticastMessage, response: BatchResponse): string[] {
	const failedTokens = [];
	response.responses.forEach((rsp, idx) => {
		if (!rsp.success) {
			failedTokens.push(message.tokens[idx]);
		}
	});
	return failedTokens;
}
