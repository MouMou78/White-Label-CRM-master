CREATE TABLE `leads` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`source` varchar(50) NOT NULL,
	`sourceType` varchar(50) NOT NULL,
	`amplemarketLeadId` varchar(255),
	`ownerEmail` varchar(320),
	`email` varchar(320) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`company` varchar(255),
	`title` varchar(255),
	`linkedinUrl` text,
	`listIds` json,
	`sequenceIds` json,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `amplemarket_lead_id_unique` UNIQUE(`tenantId`,`amplemarketLeadId`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `leads` (`tenantId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `leads` (`email`);--> statement-breakpoint
CREATE INDEX `owner_email_idx` ON `leads` (`ownerEmail`);