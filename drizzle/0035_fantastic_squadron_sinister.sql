CREATE TABLE `account_tags` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`tagId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_tag_unique` UNIQUE(`accountId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `person_tags` (
	`id` varchar(36) NOT NULL,
	`personId` varchar(36) NOT NULL,
	`tagId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `person_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `person_tag_unique` UNIQUE(`personId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_tag_name_unique` UNIQUE(`tenantId`,`name`)
);
--> statement-breakpoint
ALTER TABLE `people` ADD `assignedToUserId` varchar(36);--> statement-breakpoint
ALTER TABLE `people` ADD `assignedAt` timestamp;--> statement-breakpoint
CREATE INDEX `account_idx` ON `account_tags` (`accountId`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `account_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `person_idx` ON `person_tags` (`personId`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `person_tags` (`tagId`);