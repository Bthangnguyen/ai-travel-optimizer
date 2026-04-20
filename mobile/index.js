import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerRootComponent } from "expo";
import { NativeModules } from "react-native";

import App from "./App";

const STORAGE_KEY_TRIP = "current_trip";

function parseTrip(rawValue) {
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn("Invalid reroute payload in background handler:", error);
    return null;
  }
}

function installBackgroundMessagingHandler() {
  if (!NativeModules.RNFBAppModule) {
    return;
  }
  try {
    const firebaseMessaging = require("@react-native-firebase/messaging");
    const messaging = firebaseMessaging.default;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const reroutePayload = remoteMessage?.data?.reroute;
      const nextTrip = parseTrip(reroutePayload);
      if (!nextTrip || !nextTrip.trip_id) {
        return;
      }
      const activeTrip = parseTrip(await AsyncStorage.getItem(STORAGE_KEY_TRIP));
      if (activeTrip && activeTrip.trip_id !== nextTrip.trip_id) {
        console.warn(
          `Skip background reroute for trip ${nextTrip.trip_id} (active trip: ${activeTrip.trip_id})`,
        );
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEY_TRIP, JSON.stringify(nextTrip));
    });
  } catch (error) {
    console.warn("Unable to install background messaging handler:", error);
  }
}

installBackgroundMessagingHandler();
registerRootComponent(App);
