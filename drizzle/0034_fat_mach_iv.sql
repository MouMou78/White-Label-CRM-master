CREATE TABLE `templateVersions` (
	`id` varchar(36) NOT NULL,
	`templateId` varchar(36) NOT NULL,
	`version` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` enum('lead_nurturing','deal_management','task_automation','notifications') NOT NULL,
	`triggerType` enum('email_opened','email_replied','no_reply_after_days','meeting_held','stage_entered','deal_value_threshold','scheduled') NOT NULL,
	`triggerConfig` json DEFAULT ('{}'),
	`actionType` enum('move_stage','send_notification','create_task','enroll_sequence','update_field') NOT NULL,
	`actionConfig` json DEFAULT ('{}'),
	`conditions` json DEFAULT ('{"logic":"AND","rules":[]}'),
	`priority` int NOT NULL DEFAULT 0,
	`changelog` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userTemplates` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `userTemplates` ADD `changelog` text;--> statement-breakpoint
CREATE INDEX `template_idx` ON `templateVersions` (`templateId`);--> statement-breakpoint
CREATE INDEX `version_idx` ON `templateVersions` (`version`);