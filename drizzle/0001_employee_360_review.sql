CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_no` text,
	`name` text NOT NULL,
	`email` text,
	`department` text,
	`title` text,
	`manager_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_email_unique` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employees_name_idx` ON `employees` (`name`);--> statement-breakpoint
CREATE TABLE `evaluation_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`rater_employee_id` integer,
	`relationship` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rater_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`response_id`) REFERENCES `survey_responses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evaluation_assignments_token_unique` ON `evaluation_assignments` (`token`);--> statement-breakpoint
CREATE INDEX `evaluation_assignments_token_idx` ON `evaluation_assignments` (`token`);--> statement-breakpoint
CREATE INDEX `evaluation_assignments_subject_idx` ON `evaluation_assignments` (`subject_id`);--> statement-breakpoint
CREATE TABLE `evaluation_cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`survey_id` integer NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`anonymity_threshold` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `evaluation_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cycle_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evaluation_subjects_cycle_employee_unique` ON `evaluation_subjects` (`cycle_id`,`employee_id`);