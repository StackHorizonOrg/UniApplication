import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { eq } from "drizzle-orm";
import cron from "node-cron";
import { db } from "@/lib/db";
import { courseSnapshots, pushSubscriptions } from "@/lib/db/schema";
import { generateCourseHash, sendPushNotification } from "@/lib/notifications";
import { appRouter } from "@/server/api/root";
import { createCallerFactory } from "@/server/api/trpc";

const createCaller = createCallerFactory(appRouter);

interface TimetableEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  professor: string;
}

async function checkUpdates() {
  console.log("Checking updates...");

  const caller = createCaller({
    headers: new Headers({ "x-admin-token": process.env.ADMIN_TOKEN || "" }),
    isAdmin: true,
    userId: "system-job",
  });

  const activeSubs = await db.query.pushSubscriptions.findMany({
    columns: { linkId: true },
  });

  const linkIds = Array.from(new Set(activeSubs.map((s) => s.linkId)));

  if (linkIds.length === 0) {
    return;
  }

  for (const linkId of linkIds) {
    try {
      const now = new Date();
      const orario = (await caller.orario.getMonthlyOrario({
        linkId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        location: "Tutte",
      })) as TimetableEvent[];

      const newHash = generateCourseHash(orario);
      const snapshot = await db.query.courseSnapshots.findFirst({
        where: eq(courseSnapshots.linkId, linkId),
      });

      if (!snapshot) {
        await db.insert(courseSnapshots).values({
          linkId,
          lastHash: newHash,
          lastData: JSON.stringify(orario),
        });
        continue;
      }

      if (snapshot.lastHash !== newHash) {
        const oldData = snapshot.lastData
          ? (JSON.parse(snapshot.lastData) as TimetableEvent[])
          : [];
        const changedSubjects = findChangedSubjects(oldData, orario);

        if (changedSubjects.length === 0) {
          await db
            .update(courseSnapshots)
            .set({ lastHash: newHash, lastData: JSON.stringify(orario) })
            .where(eq(courseSnapshots.linkId, linkId));
          continue;
        }

        const subscriptions = await db.query.pushSubscriptions.findMany({
          where: eq(pushSubscriptions.linkId, linkId),
        });

        for (const sub of subscriptions) {
          const hidden = sub.filters
            ? (JSON.parse(sub.filters) as string[])
            : [];
          const hasRelevantChange = changedSubjects.some(
            (s) => !hidden.includes(s),
          );

          if (hasRelevantChange) {
            const subjectList =
              changedSubjects
                .filter((s) => !hidden.includes(s))
                .slice(0, 2)
                .join(", ") + (changedSubjects.length > 2 ? "..." : "");

            await sendPushNotification(
              sub.userId,
              linkId,
              "Aggiornamento Orario",
              `Cambio rilevato per: ${subjectList}. Controlla i dettagli nell'app.`,
            );
          }
        }

        await db
          .update(courseSnapshots)
          .set({
            lastHash: newHash,
            lastData: JSON.stringify(orario),
            lastUpdated: new Date(),
          })
          .where(eq(courseSnapshots.linkId, linkId));
      }
    } catch (err) {
      console.error(`Error for ${linkId}:`, err);
    }
  }
}

function findChangedSubjects(
  oldEvents: TimetableEvent[],
  newEvents: TimetableEvent[],
): string[] {
  const changed = new Set<string>();
  const getEventKey = (e: TimetableEvent) =>
    `${e.date}-${e.time}-${e.title}-${e.location}-${e.professor}`;

  const oldKeys = new Set(oldEvents.map(getEventKey));
  const newKeys = new Set(newEvents.map(getEventKey));

  for (const e of newEvents) {
    if (!oldKeys.has(getEventKey(e))) {
      changed.add(e.title);
    }
  }

  for (const e of oldEvents) {
    if (!newKeys.has(getEventKey(e))) {
      changed.add(e.title);
    }
  }

  return Array.from(changed);
}

if (process.argv.includes("--cron")) {
  cron.schedule("*/20 * * * *", () => {
    checkUpdates().catch(console.error);
  });
} else {
  checkUpdates()
    .then(() => {
      process.exit(0);
    })
    .catch((_err) => {
      process.exit(1);
    });
}
