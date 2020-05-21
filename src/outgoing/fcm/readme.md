# Firebase Cloud Messaging

## Server setup

### Create a Firebase project

### Save Google service accounts file
To generate a private key file for your service account:
1) In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).
2) Click **Generate New Private Key**, then confirm by clicking Generate Key.
3) Securely store the JSON file containing the key.
4) Set an environment variable to point to the absolute path of the file, like this:
```shell script
export GOOGLE_APPLICATION_CREDENTIALS="/Users/XYZ/my-service-account-file.json"
```
5) Build and start the service. Run: `npm run build && npm start`

See https://firebase.google.com/docs/admin/setup#initialize-sdk.

## Android client setup

1) You start with our simple [test Android app](https://github.com/thesocialdev/pushtester) in Android Studio.
2) Get the `google-services.json` file: [Instructions](https://support.google.com/firebase/answer/7015592).
3) Compile the app and run it on a real device or emulator. After subscribing, note the instance ID token. You can get that from logcat (hint: search for `Token`) or copy and paste it from the app UI.

See also: FCM docs to [Set up a Firebase Cloud Messaging client app on Android](https://firebase.google.com/docs/cloud-messaging/android/client).

## Send a message from server to client

1) Open the [Swagger UI](http://localhost:8900/?doc#/Push%20notifications/post_v1_message_fcm), under `POST /v1/message/fcm` press the 'Try it out' button.
2) Paste the device token from the Android client setup to the JSON request body (replace the string __REPLACE_ME__ with the actual device token you copied from the Android client).
3) Press the 'Execute' button.
