ALTER TABLE `analytics_users` MODIFY COLUMN `last_seen` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `analytics_users` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `api_logs` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `api_logs` MODIFY COLUMN `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `api_logs` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `year` int;--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `academic_year` varchar(255);--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `verified` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `verified` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `analytics_users` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `api_logs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `courses` ADD PRIMARY KEY(`id`);