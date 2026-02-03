CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`domain` varchar(255),
	`industry` text,
	`employees` varchar(50),
	`revenue` varchar(100),
	`technologies` json,
	`headquarters` text,
	`foundingYear` int,
	`lastFundingRound` varchar(100),
	`firstContacted` timestamp,
	`linkedinUrl` varchar(500),
	`enrichmentSource` text,
	`enrichmentSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `people` ADD `accountId` varchar(36);--> statement-breakpoint
ALTER TABLE `people` ADD `firstName` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `lastName` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `companyDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `people` ADD `companySize` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `simplifiedTitle` text;--> statement-breakpoint
ALTER TABLE `people` ADD `manuallyAddedNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `manuallyAddedNumberDncStatus` varchar(20);--> statement-breakpoint
ALTER TABLE `people` ADD `sourcedNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `sourcedNumberDncStatus` varchar(20);--> statement-breakpoint
ALTER TABLE `people` ADD `mobileNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `mobileNumberDncStatus` varchar(20);--> statement-breakpoint
ALTER TABLE `people` ADD `workNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `workNumberDncStatus` varchar(20);--> statement-breakpoint
ALTER TABLE `people` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `location` text;--> statement-breakpoint
ALTER TABLE `people` ADD `linkedinUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `people` ADD `industry` text;--> statement-breakpoint
ALTER TABLE `people` ADD `status` varchar(50);--> statement-breakpoint
ALTER TABLE `people` ADD `numberOfOpens` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `people` ADD `label` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `meetingBooked` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `people` ADD `owner` varchar(320);--> statement-breakpoint
ALTER TABLE `people` ADD `sequenceName` text;--> statement-breakpoint
ALTER TABLE `people` ADD `sequenceTemplateName` text;--> statement-breakpoint
ALTER TABLE `people` ADD `savedSearchOrLeadListName` text;--> statement-breakpoint
ALTER TABLE `people` ADD `mailbox` varchar(320);--> statement-breakpoint
ALTER TABLE `people` ADD `contactUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `people` ADD `replied` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `people` ADD `lastStageExecuted` int;--> statement-breakpoint
ALTER TABLE `people` ADD `lastStageExecutedAt` timestamp;--> statement-breakpoint
ALTER TABLE `people` ADD `notes` text;--> statement-breakpoint
CREATE INDEX `tenant_domain_idx` ON `accounts` (`tenantId`,`domain`);--> statement-breakpoint
CREATE INDEX `tenant_account_name_idx` ON `accounts` (`tenantId`,`name`);