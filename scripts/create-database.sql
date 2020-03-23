-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Mar 23, 2020 at 06:09 AM
-- Server version: 5.7.24-log
-- PHP Version: 7.2.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `birthdaydev`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`admin`@`%` PROCEDURE `DoesGuildAlreadyExist` (IN `IN_DiscordID` VARCHAR(18))  BEGIN

SELECT COUNT(*) > 0 AS AlreadyExists
FROM guild
WHERE `DiscordId` = IN_DiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `DoesUserAlreadyExist` (IN `IN_UserDiscordId` VARCHAR(18))  BEGIN

SELECT COUNT(*) > 0 AS AlreadyExists
FROM users
WHERE `UserDiscordId` = IN_UserDiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetBirthdayChannel` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT BirthdayChannel
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetBirthdayRole` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT BirthdayRole
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetBirthdays` (IN `IN_Birthday` VARCHAR(10))  BEGIN

SELECT UserDiscordId
FROM users
WHERE DATE_FORMAT(users.Birthday, '%m-%d') = IN_Birthday;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetChangesLeft` (IN `IN_UserId` INT(11))  BEGIN

SELECT ChangesLeft
FROM users
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetGuildBirthdayMessage` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT Custommessage
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetGuildId` (IN `IN_DiscordId` VARCHAR(18))  BEGIN

SELECT GuildId
FROM guild
WHERE `DiscordId` = IN_DiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetGuildSettingsId` (IN `IN_DiscordId` VARCHAR(18))  BEGIN

SELECT GuildSettingsId
FROM guild
WHERE `DiscordId` = IN_DiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetHideAge` (IN `IN_UserId` INT(11))  BEGIN

SELECT HideAge
FROM users
WHERE `UserId` = In_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetMentionSetting` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT MentionSetting
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetMessageTime` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT MessageTime
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetNextBirthday1` (IN `IN_DiscordIds` MEDIUMTEXT)  BEGIN

SELECT *
FROM users
WHERE FIND_IN_SET(`UserDiscordId`, IN_DiscordIds) IS NOT NULL
AND FIND_IN_SET(`UserDiscordId`, IN_DiscordIds) > 0
AND DATE_ADD(Birthday, INTERVAL YEAR(CURDATE())-YEAR(Birthday) YEAR) > CURRENT_DATE
ORDER BY Birthday DESC;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetNextBirthday2` (IN `IN_DiscordIds` MEDIUMTEXT)  BEGIN

SELECT *
FROM users
WHERE FIND_IN_SET(`UserDiscordId`, IN_DiscordIds) IS NOT NULL
AND FIND_IN_SET(`UserDiscordId`, IN_DiscordIds) > 0
AND DATE_ADD(Birthday, INTERVAL YEAR(CURDATE())-YEAR(Birthday) YEAR) < CURRENT_DATE
ORDER BY Birthday ASC;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetNextBirthdays` (IN `IN_Birthday` DATE)  NO SQL
BEGIN

SELECT *
FROM users
WHERE `Birthday` = IN_Birthday;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetPrefix` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT Prefix
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetPreventAge` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT PreventAge
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetTrustedPreventsMessage` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT TrustedPreventsMessage
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetTrustedPreventsRole` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT TrustedPreventsRole
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetTrustedRole` (IN `IN_GuildSettingsId` INT(11))  BEGIN

SELECT TrustedRole
FROM guildsettings
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetUserBirthday` (IN `IN_UserId` INT(11))  BEGIN

SELECT Birthday
FROM users
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetUserBirthdayFromDiscordId` (IN `IN_DiscordId` VARCHAR(18))  NO SQL
BEGIN

SELECT *
FROM users
WHERE `UserDiscordId` = IN_DiscordId
LIMIT 1;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetUserId` (IN `IN_UserDiscordId` VARCHAR(18))  BEGIN

SELECT UserId
FROM users
WHERE `UserDiscordId` = IN_UserDiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `GetUserZoneId` (IN `IN_UserId` INT(11))  BEGIN

SELECT ZoneId
FROM users
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `InsertGuild` (IN `IN_DiscordId` VARCHAR(18), IN `IN_GuildSettingsId` INT(11), IN `IN_Active` TINYINT(1))  BEGIN

INSERT INTO guild(DiscordId, GuildSettingsId, Active)
VALUES(IN_DiscordId, IN_GuildSettingsId, IN_Active);

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `InsertGuildSettings` (IN `IN_Prefix` VARCHAR(100))  BEGIN

INSERT guildsettings
SET `Prefix` = IN_Prefix;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `InsertUser` (IN `IN_UserDiscordId` VARCHAR(18))  BEGIN

INSERT IGNORE INTO users(UserDiscordId)
VALUES(IN_UserDiscordId);

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `IsGuildActive` (IN `IN_DiscordId` VARCHAR(18))  BEGIN

SELECT Active
FROM guild
WHERE `DiscordId` = IN_DiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `SelectLastInsertID` ()  BEGIN

SELECT LAST_INSERT_ID();

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateBirthday` (IN `IN_UserId` INT(11), IN `IN_Birthday` DATE)  BEGIN

UPDATE users
SET `Birthday` = IN_Birthday
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateBirthdayChannel` (IN `IN_ChannelId` VARCHAR(18), IN `IN_GuildSettingsId` INT(11))  BEGIN

UPDATE guildsettings
SET `BirthdayChannel` = IN_ChannelId
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateBirthdayRole` (IN `IN_RoleId` VARCHAR(18), IN `IN_GuildSettingsId` INT(11))  BEGIN

UPDATE guildsettings
SET `BirthdayRole` = IN_RoleId
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateChangesLeft` (IN `IN_UserId` INT(11), IN `IN_Left` TINYINT)  BEGIN

UPDATE users
SET `ChangesLeft` = IN_Left
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateGuildActive` (IN `IN_DiscordId` VARCHAR(18), IN `IN_Active` TINYINT(1))  BEGIN

UPDATE guild
SET `Active` = IN_Active
WHERE `DiscordId` = IN_DiscordId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateHideAge` (IN `IN_UserId` INT(11), IN `IN_Setting` TINYINT(1))  BEGIN

UPDATE users
SET `HideAge` = IN_Setting
WHERE `UserId` = IN_UserId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateMentionSetting` (IN `IN_GuildSettingsId` INT(11), IN `IN_Setting` VARCHAR(18))  BEGIN

UPDATE guildsettings
SET `MentionSetting` = IN_Setting
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateMessage` (IN `IN_GuildSettingsId` INT(11), IN `IN_Message` VARCHAR(2000))  BEGIN

UPDATE guildsettings
SET `CustomMessage` = IN_Message
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateMessageTime` (IN `IN_GuildSettingsId` INT(11), IN `IN_Time` TINYINT(1))  BEGIN

UPDATE guildsettings
SET `MessageTime` = IN_Time
WHERE `GuildSettingsId` = IN_GuildSettingsID;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdatePrefix` (IN `IN_Prefix` VARCHAR(100), IN `IN_GuildSettingsId` INT(11))  BEGIN

UPDATE guildsettings
SET `Prefix` = IN_Prefix
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdatePreventAge` (IN `IN_GuildSettingsId` INT(11), IN `IN_Setting` TINYINT(1))  BEGIN

UPDATE guildsettings
SET `PreventAge` = IN_Setting
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdatePreventMessage` (IN `IN_GuildSettingsId` INT(11), IN `IN_Setting` TINYINT(1))  BEGIN

UPDATE guildsettings
SET `TrustedPreventsMessage` = IN_Setting
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdatePreventRole` (IN `IN_GuildSettingsId` INT(11), IN `IN_Setting` TINYINT(1))  BEGIN

UPDATE guildsettings
SET `TrustedPreventsRole` = IN_Setting
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateTrustedRole` (IN `IN_RoleId` VARCHAR(18), IN `IN_GuildSettingsId` INT(11))  BEGIN

UPDATE guildsettings
SET `TrustedRole` = IN_RoleId
WHERE `GuildSettingsId` = IN_GuildSettingsId;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `UpdateZoneId` (IN `IN_UserId` INT(11), IN `IN_ZoneId` TINYTEXT)  BEGIN

UPDATE users
SET `ZoneId` = IN_ZoneId
WHERE `UserId` = IN_UserId;

END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `SPLIT_STRING` (`str` VARCHAR(255), `delim` MEDIUMTEXT, `pos` INT(11)) RETURNS INT(11) RETURN REPLACE(
	SUBSTRING(
		SUBSTRING_INDEX(str , delim , pos) ,
		CHAR_LENGTH(
			SUBSTRING_INDEX(str , delim , pos - 1)
		) + 1
	) ,
	delim ,
	''
)$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `guild`
--

CREATE TABLE `guild` (
  `GuildId` int(11) NOT NULL,
  `DiscordId` varchar(18) NOT NULL,
  `GuildSettingsId` int(11) DEFAULT NULL,
  `Active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `guildsettings`
--

CREATE TABLE `guildsettings` (
  `GuildSettingsId` int(11) NOT NULL,
  `Prefix` varchar(100) NOT NULL,
  `BirthdayRole` varchar(18) DEFAULT '0',
  `TrustedRole` varchar(18) DEFAULT '0',
  `BirthdayChannel` varchar(18) DEFAULT '0',
  `MentionSetting` varchar(18) DEFAULT '0',
  `MessageTime` tinyint(1) DEFAULT '0',
  `TrustedPreventsRole` tinyint(1) DEFAULT '1',
  `TrustedPreventsMessage` tinyint(1) DEFAULT '1',
  `CustomMessage` varchar(2000) DEFAULT '0',
  `PreventAge` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserId` int(11) NOT NULL,
  `UserDiscordId` varchar(18) NOT NULL,
  `Birthday` date DEFAULT NULL,
  `ZoneId` tinytext,
  `ChangesLeft` tinyint(4) DEFAULT '3',
  `HideAge` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `guild`
--
ALTER TABLE `guild`
  ADD PRIMARY KEY (`GuildId`),
  ADD KEY `GuildSettingsId` (`GuildSettingsId`);

--
-- Indexes for table `guildsettings`
--
ALTER TABLE `guildsettings`
  ADD PRIMARY KEY (`GuildSettingsId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `guild`
--
ALTER TABLE `guild`
  MODIFY `GuildId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guildsettings`
--
ALTER TABLE `guildsettings`
  MODIFY `GuildSettingsId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserId` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `guild`
--
ALTER TABLE `guild`
  ADD CONSTRAINT `guild_ibfk_1` FOREIGN KEY (`GuildSettingsId`) REFERENCES `guildsettings` (`GuildSettingsId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
