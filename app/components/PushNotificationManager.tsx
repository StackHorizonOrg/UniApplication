"use client";

import { Bell, BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocalStorage, useUserId } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function PushNotificationManager({ linkId }: { linkId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [_permission, setPermission] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const _userId = useUserId();
  const [hiddenSubjects] = useLocalStorage<string[]>("hiddenSubjects", []);

  const subscribeMutation = api.notifications.subscribe.useMutation();
  const unsubscribeMutation = api.notifications.unsubscribe.useMutation();
  const updateFiltersMutation =
    api.notifications.updateAllFilters.useMutation();

  const checkSubscription = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout SW")), 5000))
      ]);

      if (!registration) return;
      
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error("Check subscription failed:", e);
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [checkSubscription]);

  useEffect(() => {
    if (isSubscribed && hiddenSubjects.length > 0) {
      updateFiltersMutation.mutate({ filters: hiddenSubjects });
    }
  }, [isSubscribed, hiddenSubjects, updateFiltersMutation.mutate]);

  const handleSubscribe = async () => {
    if (!VAPID_PUBLIC_KEY) return;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

            if (result !== "granted") {
              setLoading(false);
              return;
            }
      
            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<ServiceWorkerRegistration>((_, reject) => setTimeout(() => reject(new Error("Timeout SW")), 5000))
            ]);
            
            const subscription = await registration.pushManager.subscribe({
      
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = subscription.toJSON();
      if (subJSON.endpoint && subJSON.keys?.p256dh && subJSON.keys?.auth) {
        await subscribeMutation.mutateAsync({
          linkId,
          filters: hiddenSubjects,
          subscription: {
            endpoint: subJSON.endpoint,
            keys: {
              p256dh: subJSON.keys.p256dh,
              auth: subJSON.keys.auth,
            },
          },
        });
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) => setTimeout(() => reject(new Error("Timeout SW")), 5000))
      ]);
      
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await unsubscribeMutation.mutateAsync({ linkId });
      setIsSubscribed(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
          isSubscribed
            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
        )}
      >
        {loading ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="w-3.5 h-3.5" />
        ) : (
          <Bell className="w-3.5 h-3.5" />
        )}
        {isSubscribed ? "Notifiche On" : "Attiva Notifiche"}
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
