CREATE TABLE `notes` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`entityType` enum('contact','account','deal','task','thread') NOT NULL,
	`entityId` varchar(36) NOT NULL,
	`createdBy` varchar(36) NOT NULL,
	`createdByName` varchar(255) NOT NULL,
	`updatedBy` varchar(36),
	`updatedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notes_tenant_idx` ON `notes` (`tenantId`);--> statement-breakpoint
CREATE INDEX `notes_entity_idx` ON `notes` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `notes_created_by_idx` ON `notes` (`createdBy`);--> statement-breakpoint
CREATE INDEX `notes_created_at_idx` ON `notes` (`createdAt`);