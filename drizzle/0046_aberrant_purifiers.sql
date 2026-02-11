CREATE TABLE `demo_bookings` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`salesManagerId` varchar(36) NOT NULL,
	`bookedByUserId` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`meetLink` varchar(500) NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demo_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `demo_tenant_manager_idx` ON `demo_bookings` (`tenantId`,`salesManagerId`);--> statement-breakpoint
CREATE INDEX `demo_start_time_idx` ON `demo_bookings` (`startTime`);