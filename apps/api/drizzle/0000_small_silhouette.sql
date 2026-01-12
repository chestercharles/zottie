CREATE TABLE `pantry_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'in_stock' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
