CREATE TABLE `syncHistory` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`provider` varchar(50) NOT NULL,
	`syncType` varchar(50) NOT NULL,
	`status` enum('success','partial','failed') NOT NULL,
	`recordsSynced` int NOT NULL DEFAULT 0,
	`conflictsResolved` int NOT NULL DEFAULT 0,
	`errors` json,
	`config` json,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `syncHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`provider` varchar(50) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`headers` json,
	`processedAt` timestamp,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `webhook_events_tenant_idx` ON `webhookEvents` (`tenantId`);--> statement-breakpoint
CREATE INDEX `webhook_events_provider_idx` ON `webhookEvents` (`provider`);--> statement-breakpoint
CREATE INDEX `webhook_events_created_idx` ON `webhookEvents` (`createdAt`);