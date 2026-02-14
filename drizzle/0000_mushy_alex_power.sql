-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `analytics_users` (
	`id` varchar(255) NOT NULL,
	`last_seen` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`user_id` varchar(255) DEFAULT 'NULL',
	`timestamp` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`linkId` varchar(255) NOT NULL,
	`year` int(11) DEFAULT 'NULL',
	`academic_year` varchar(255) DEFAULT 'NULL',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT '''pending''',
	`verified` tinyint(1) NOT NULL DEFAULT 0,
	`added_by` varchar(255) NOT NULL,
	`user_id` varchar(255) DEFAULT 'NULL',
	`created_at` timestamp NOT NULL DEFAULT 'current_timestamp()'
);

*/