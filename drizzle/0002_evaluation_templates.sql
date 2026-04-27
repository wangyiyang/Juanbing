CREATE TABLE `evaluation_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`survey_id` integer NOT NULL,
	`anonymity_threshold` integer DEFAULT 3 NOT NULL,
	`relationship_rules` text NOT NULL,
	`time_rule` text NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`created_by` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `evaluation_cycles` ADD `template_id` integer REFERENCES evaluation_templates(id);