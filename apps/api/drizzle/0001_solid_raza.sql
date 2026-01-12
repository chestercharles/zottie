CREATE TABLE `household_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`code` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `household_invites_code_unique` ON `household_invites` (`code`);