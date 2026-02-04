CREATE TABLE `activityFeed` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`actionType` enum('created_deal','updated_deal','moved_deal_stage','created_contact','updated_contact','sent_email','created_task','completed_task','added_note','created_account','updated_account') NOT NULL,
	`entityType` enum('deal','contact','account','task','email'),
	`entityId` varchar(36),
	`entityName` text,
	`description` text,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityFeed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sharedViews` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`viewType` enum('deals','contacts','accounts','tasks') NOT NULL,
	`filters` json DEFAULT ('{}'),
	`sortBy` varchar(100),
	`sortOrder` enum('asc','desc') DEFAULT 'asc',
	`createdById` varchar(36) NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`sharedWithUserIds` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sharedViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_tenant_idx` ON `activityFeed` (`tenantId`);--> statement-breakpoint
CREATE INDEX `activity_user_idx` ON `activityFeed` (`userId`);--> statement-breakpoint
CREATE INDEX `activity_entity_idx` ON `activityFeed` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `activity_created_idx` ON `activityFeed` (`createdAt`);--> statement-breakpoint
CREATE INDEX `shared_views_tenant_idx` ON `sharedViews` (`tenantId`);--> statement-breakpoint
CREATE INDEX `shared_views_creator_idx` ON `sharedViews` (`createdById`);--> statement-breakpoint
CREATE INDEX `shared_views_type_idx` ON `sharedViews` (`viewType`);