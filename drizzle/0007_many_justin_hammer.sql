ALTER TABLE `accounts` ADD `fitScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `accounts` ADD `intentScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `accounts` ADD `combinedScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `accounts` ADD `fitTier` enum('A','B','C');--> statement-breakpoint
ALTER TABLE `accounts` ADD `intentTier` enum('Hot','Warm','Cold');--> statement-breakpoint
ALTER TABLE `accounts` ADD `scoreReasons` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `accounts` ADD `lifecycleStage` enum('Lead','MQL','SQL','Opportunity','ClosedWon','ClosedLost') DEFAULT 'Lead';--> statement-breakpoint
ALTER TABLE `accounts` ADD `lifecycleStageEnteredAt` timestamp;--> statement-breakpoint
ALTER TABLE `accounts` ADD `ownerUserId` varchar(36);--> statement-breakpoint
ALTER TABLE `people` ADD `fitScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `people` ADD `intentScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `people` ADD `combinedScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `people` ADD `fitTier` enum('A','B','C');--> statement-breakpoint
ALTER TABLE `people` ADD `intentTier` enum('Hot','Warm','Cold');--> statement-breakpoint
ALTER TABLE `people` ADD `scoreReasons` json DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `people` ADD `lifecycleStage` enum('Lead','MQL','SQL','Opportunity','ClosedWon','ClosedLost') DEFAULT 'Lead';--> statement-breakpoint
ALTER TABLE `people` ADD `lifecycleStageEnteredAt` timestamp;--> statement-breakpoint
ALTER TABLE `people` ADD `seniority` enum('C-Level','VP','Director','Manager','IC','Other');--> statement-breakpoint
ALTER TABLE `people` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `people` ADD `region` varchar(100);