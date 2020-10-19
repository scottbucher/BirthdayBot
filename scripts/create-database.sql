-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Oct 19, 2020 at 12:46 AM
-- Server version: 10.3.22-MariaDB-0+deb10u1
-- PHP Version: 7.3.14-1~deb10u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `***REMOVED***`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`admin`@`localhost` PROCEDURE `Blacklist_Add` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_UserDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;
SET @MessageId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

INSERT IGNORE INTO `blacklist` (
	GuildId,
	UserDiscordId
) VALUES (
	@GuildId,
	IN_UserDiscordId
);
END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Blacklist_Clear` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

DELETE
FROM `blacklist`
WHERE
		GuildId = @GuildId; 
END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Blacklist_Get` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SET @Row_Number = 0;

SELECT
		*,
        ROW_NUMBER() OVER (
       		ORDER BY BlacklistId 
        ) AS Position
    FROM `blacklist`
    WHERE GuildId = @GuildId
ORDER BY BlacklistId;

END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Blacklist_GetList` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_PageSize` INT, IN `IN_Page` INT)  BEGIN

SET @GuildId = NULL;
SET @TotalPages = NULL;
SET @TotalItems = NULL;
SET @StartRow = NULL;
SET @EndRow = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT COUNT(*) 
INTO @TotalItems
FROM `blacklist`
WHERE GuildId = @GuildId;

SELECT CEILING(@TotalItems/IN_PageSize) INTO @TotalPages;

IF (IN_Page < 0) THEN 
	SET IN_Page = 1;
ELSEIF (IN_Page > @TotalPages) THEN 
	SET IN_Page = @TotalPages;
END IF;

SET @StartRow = ((IN_Page - 1) * IN_PageSize) + 1;
SET @EndRow = IN_Page * IN_PageSize;

SELECT *
FROM (
	SELECT
			*,
            ROW_NUMBER() OVER (
       			ORDER BY BlacklistId 
            ) AS Position
    	FROM `blacklist`
        WHERE GuildId = @GuildId
	ORDER BY BlacklistId
) AS Blacklisted
WHERE
    Blacklisted.Position >= @StartRow AND
    Blacklisted.Position <= @EndRow;

SELECT
    @TotalItems AS 'TotalItems',
    @TotalPages as 'TotalPages';
    
DROP TEMPORARY TABLE IF EXISTS temp;
END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Blacklist_Remove` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_UserDiscordId` VARCHAR(20))  NO SQL
BEGIN

SET @GuildId = NULL;
SET @MessageId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

DELETE
FROM `blacklist`
WHERE
		GuildId = @GuildId AND
        UserDiscordId = IN_UserDiscordId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CustomMessages_Add` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Message` VARCHAR(2000), IN `IN_UserDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;
SET @MessageId = NULL;
SET @UserMessage = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT MessageId
INTO @UserMessage
FROM `messages`
WHERE GuildId = @GuildId AND UserDiscordId = IN_UserDiscordId AND UserDiscordId  <> '0';

IF @UserMessage IS NULL THEN
	INSERT INTO `messages` (
		GuildId,
		Message,
    	UserDiscordId
	) VALUES (
		@GuildId,
		IN_Message,
    	IN_UserDiscordId
	);
ELSE
	UPDATE `messages`
    SET
    	Message = IN_Message
    WHERE MessageId = @UserMessage;
END IF;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CustomMessages_Clear` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

DELETE
FROM `messages`
WHERE
		GuildId = @GuildId; 
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CustomMessages_Get` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SET @Row_Number = 0;

SELECT
		*,
        ROW_NUMBER() OVER (
       		ORDER BY MessageId 
        ) AS Position
    FROM `messages`
    WHERE GuildId = @GuildId AND UserDiscordId = '0'
ORDER BY MessageId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CustomMessages_GetList` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_PageSize` INT, IN `IN_Page` INT)  BEGIN

SET @GuildId = NULL;
SET @TotalPages = NULL;
SET @TotalItems = NULL;
SET @StartRow = NULL;
SET @EndRow = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT COUNT(*) 
INTO @TotalItems
FROM `messages`
WHERE GuildId = @GuildId AND UserDiscordId = '0';

SELECT CEILING(@TotalItems/IN_PageSize) INTO @TotalPages;

IF (IN_Page < 0) THEN 
	SET IN_Page = 1;
ELSEIF (IN_Page > @TotalPages) THEN 
	SET IN_Page = @TotalPages;
END IF;

SET @StartRow = ((IN_Page - 1) * IN_PageSize) + 1;
SET @EndRow = IN_Page * IN_PageSize;

SELECT *
FROM (
	SELECT
			*,
            ROW_NUMBER() OVER (
       			ORDER BY MessageId 
            ) AS Position
    	FROM `messages`
        WHERE GuildId = @GuildId AND UserDiscordId = '0'
	ORDER BY MessageId
) AS CustomMessage
WHERE
    CustomMessage.Position >= @StartRow AND
    CustomMessage.Position <= @EndRow;

SELECT
    @TotalItems AS 'TotalItems',
    @TotalPages as 'TotalPages';
    
DROP TEMPORARY TABLE IF EXISTS temp;
END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `CustomMessages_GetUser` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SET @Row_Number = 0;

SELECT
		*,
        ROW_NUMBER() OVER (
       		ORDER BY MessageId 
        ) AS Position
    FROM `messages`
    WHERE GuildId = @GuildId AND UserDiscordId <> '0'
ORDER BY MessageId;

END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `CustomMessages_GetUserList` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_PageSize` INT, IN `IN_Page` INT)  NO SQL
BEGIN

SET @GuildId = NULL;
SET @TotalPages = NULL;
SET @TotalItems = NULL;
SET @StartRow = NULL;
SET @EndRow = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT COUNT(*) 
INTO @TotalItems
FROM `messages`
WHERE GuildId = @GuildId AND UserDiscordId <> '0';

SELECT CEILING(@TotalItems/IN_PageSize) INTO @TotalPages;

IF (IN_Page < 0) THEN 
	SET IN_Page = 1;
ELSEIF (IN_Page > @TotalPages) THEN 
	SET IN_Page = @TotalPages;
END IF;

SET @StartRow = ((IN_Page - 1) * IN_PageSize) + 1;
SET @EndRow = IN_Page * IN_PageSize;

SELECT *
FROM (
	SELECT
			*,
            ROW_NUMBER() OVER (
       			ORDER BY MessageId 
            ) AS Position
    	FROM `messages`
        WHERE GuildId = @GuildId AND UserDiscordId <> '0'
	ORDER BY MessageId
) AS CustomMessage
WHERE
    CustomMessage.Position >= @StartRow AND
    CustomMessage.Position <= @EndRow;

SELECT
    @TotalItems AS 'TotalItems',
    @TotalPages as 'TotalPages';
    
DROP TEMPORARY TABLE IF EXISTS temp;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CustomMessages_Remove` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Position` INT)  BEGIN

SET @GuildId = NULL;
SET @MessageId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT M.MessageId
INTO @MessageId
FROM (
        SELECT
                *,
                ROW_NUMBER() OVER (
       				ORDER BY MessageId 
                ) AS Position
    		FROM `messages`
            WHERE GuildId = @GuildId AND UserDiscordId = '0'
) AS M
WHERE M.Position = IN_Position;

DELETE
FROM `messages`
WHERE
        MessageId = @MessageId;
END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `CustomMessages_RemoveUser` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Position` INT)  BEGIN

SET @GuildId = NULL;
SET @MessageId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

SELECT M.MessageId
INTO @MessageId
FROM (
        SELECT
                *,
                ROW_NUMBER() OVER (
       				ORDER BY MessageId 
                ) AS Position
    		FROM `messages`
            WHERE GuildId = @GuildId AND UserDiscordId <> '0'
) AS M
WHERE M.Position = IN_Position;

DELETE
FROM `messages`
WHERE
        MessageId = @MessageId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_AddOrUpdate` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_BirthdayChannelDiscordId` VARCHAR(20), IN `IN_BirthdayRoleDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

IF @GuildId IS NULL THEN
	INSERT INTO `guild` (
		GuildDiscordId,
		BirthdayChannelDiscordId,
		BirthdayRoleDiscordId
	) VALUES (
		IN_GuildDiscordId,
		IN_BirthdayChannelDiscordId,
		IN_BirthdayRoleDiscordId
	);
ELSE
	UPDATE `guild`
	SET
		GuildDiscordId = IN_GuildDiscordId,
		BirthdayChannelDiscordId = IN_BirthdayChannelDiscordId,
		BirthdayRoleDiscordId = IN_BirthdayRoleDiscordId
	WHERE GuildId = @GuildId;
END IF;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_Get` (IN `IN_GuildDiscordId` VARCHAR(20))  BEGIN

SELECT *
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_GetAll` (IN `IN_GuildDiscordIds` MEDIUMTEXT)  BEGIN

SELECT *
FROM `guild`
WHERE FIND_IN_SET(GuildDiscordId, IN_GuildDiscordIds) > 0;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_SetupMessage` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_MessageTime` TINYINT, IN `IN_MentionSetting` VARCHAR(20), IN `IN_UseEmbed` TINYINT(1))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET
	GuildDiscordId = IN_GuildDiscordId,
	MessageTime = IN_MessageTime,
    MentionSetting = IN_MentionSetting,
    UseEmbed = IN_UseEmbed
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_SetupTrusted` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_TrustedRoleDiscordId` VARCHAR(20), IN `IN_TrustedPreventsRole` TINYINT(1), IN `IN_TrustedPreventsMessage` TINYINT(1))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET
	GuildDiscordId = IN_GuildDiscordId,
	TrustedRoleDiscordId = IN_TrustedRoleDiscordId,
    TrustedPreventsRole = IN_TrustedPreventsRole,
    TrustedPreventsMessage = IN_TrustedPreventsMessage
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateBirthdayChannel` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_BirthdayChannelDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET BirthdayChannelDiscordId = IN_BirthdayChannelDiscordId
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Guild_UpdateBirthdayMasterRole` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_BirthdayMasterRoleDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET BirthdayMasterRoleDiscordId = IN_BirthdayMasterRoleDiscordId
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateBirthdayRole` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_BirthdayRoleDiscordId` VARCHAR(20))  NO SQL
BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET BirthdayRoleDiscordId = IN_BirthdayRoleDiscordId
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateMentionSetting` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_MentionSetting` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET MentionSetting = IN_MentionSetting
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`admin`@`localhost` PROCEDURE `Guild_UpdateMessageEmbedColor` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_HexColor` VARCHAR(6))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET MessageEmbedColor = IN_HexColor
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateMessageTime` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Time` TINYINT)  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET MessageTime = IN_Time
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateTrustedPreventsMessage` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Value` TINYINT(1))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET TrustedPreventsMessage = IN_Value
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateTrustedPreventsRole` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Value` TINYINT(1))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET TrustedPreventsRole = IN_Value
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateTrustedRole` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_TrustedRoleDiscordId` VARCHAR(20))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET TrustedRoleDiscordId = IN_TrustedRoleDiscordId
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `Guild_UpdateUseEmbed` (IN `IN_GuildDiscordId` VARCHAR(20), IN `IN_Value` TINYINT(1))  BEGIN

SET @GuildId = NULL;

SELECT GuildId
INTO @GuildId
FROM `guild`
WHERE GuildDiscordId = IN_GuildDiscordId;

UPDATE `guild`
SET UseEmbed = IN_Value
WHERE GuildId = @GuildId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `User_AddOrUpdate` (IN `IN_UserDiscordId` VARCHAR(20), IN `IN_Birthday` DATE, IN `IN_Timezone` VARCHAR(100), IN `IN_ChangesLeft` TINYINT)  BEGIN

SET @UserId = NULL;

SELECT UserId
INTO @UserId
FROM `user`
WHERE UserDiscordId = IN_UserDiscordId;

IF @UserId IS NULL THEN
	INSERT INTO `user` (
		UserDiscordId,
		Birthday,
		TimeZone,
        ChangesLeft
	) VALUES (
		IN_UserDiscordId,
		IN_Birthday,
		IN_Timezone,
        IN_ChangesLeft
	);
ELSE
	UPDATE `user`
	SET
		UserDiscordId = IN_UserDiscordId,
		Birthday = IN_Birthday,
		TimeZone = IN_TimeZone,
        ChangesLeft = IN_ChangesLeft
	WHERE UserId = @UserId;
END IF;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_AddVote` (IN `IN_BotSiteName` VARCHAR(50), IN `IN_UserDiscordId` VARCHAR(20))  MODIFIES SQL DATA
BEGIN
    
INSERT INTO `vote` (
	BotSiteName,
	UserDiscordId
) VALUES (
    IN_BotSiteName,
	IN_UserDiscordId
);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `User_Get` (IN `IN_UserDiscordId` VARCHAR(20))  BEGIN

SELECT *
FROM `user`
WHERE UserDiscordId = IN_UserDiscordId;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `User_GetAll` (IN `IN_UserDiscordIds` MEDIUMTEXT)  BEGIN

DROP TEMPORARY TABLE IF EXISTS temp;
CREATE TEMPORARY TABLE temp( val VARCHAR(20), INDEX(val)  );
SET @SQL = CONCAT("INSERT INTO temp (val) values ('", REPLACE(IN_UserDiscordIds, ",", "'),('"),"');");

PREPARE stmt1 FROM @sql;
EXECUTE stmt1;

SELECT *
FROM (
    SELECT *
    FROM temp AS T
    JOIN `user`AS U
        ON U.UserDiscordId = T.val
    WHERE U.Birthday IS NOT NULL AND U.Timezone IS NOT NULL
       ORDER BY U.Birthday
) AS UserData;

DROP TEMPORARY TABLE IF EXISTS temp;
END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetBirthdays` (IN `IN_Birthday` VARCHAR(10))  BEGIN

SELECT *
FROM `user`
WHERE DATE_FORMAT(`user`.Birthday, '%m-%d') = IN_Birthday;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetBirthdaysThisMonthCount` (IN `IN_Birthday` VARCHAR(10))  READS SQL DATA
BEGIN

SELECT COUNT(*) AS Total
FROM `user`
WHERE DATE_FORMAT(`user`.Birthday, '%m') = IN_Birthday;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetBirthdaysTodayCount` (IN `IN_Birthday` VARCHAR(10))  READS SQL DATA
BEGIN

SELECT COUNT(*) AS Total
FROM `user`
WHERE DATE_FORMAT(`user`.Birthday, '%m-%d') = IN_Birthday;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `User_GetFullList` (IN `IN_UserDiscordIds` MEDIUMTEXT, IN `IN_PageSize` INT, IN `IN_Page` INT)  BEGIN
DROP TEMPORARY TABLE IF EXISTS temp;

SET @TotalPages = NULL;
SET @TotalItems = NULL;
SET @StartRow = NULL;
SET @EndRow = NULL;

CREATE TEMPORARY TABLE temp( val VARCHAR(20), INDEX(val) );
SET @SQL = CONCAT("INSERT INTO temp (val) values ('", REPLACE(IN_UserDiscordIds, ",", "'),('"),"');");
PREPARE stmt1 FROM @sql;
EXECUTE stmt1;

SELECT COUNT(*) INTO @TotalItems
FROM temp AS T
JOIN `user`AS U
    ON U.UserDiscordId = T.val
WHERE
    U.Birthday IS NOT NULL AND
    U.Timezone IS NOT NULL;

SELECT CEILING(@TotalItems / IN_PageSize) INTO @TotalPages;

IF (IN_Page < 0) THEN 
    SET IN_Page = 1;
ELSEIF (IN_Page > @TotalPages) THEN 
    SET IN_Page = @TotalPages;
END IF;

SET @StartRow = ((IN_Page - 1) * IN_PageSize) + 1;
SET @EndRow = IN_Page * IN_PageSize;

SELECT *
FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (
            ORDER BY U.Birthday
        ) AS 'Position'
    FROM temp AS T
    JOIN `user`AS U
        ON U.UserDiscordId = T.val
    WHERE
        U.Birthday IS NOT NULL AND
        U.Timezone IS NOT NULL
) AS UserData
WHERE
    UserData.Position >= @StartRow AND
    UserData.Position <= @EndRow;

SELECT
    @TotalItems AS 'TotalItems',
    @TotalPages as 'TotalPages',
    IN_Page as 'Page';
    
DROP TEMPORARY TABLE IF EXISTS temp;
END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetFullListFromDate` (IN `IN_UserDiscordIds` MEDIUMTEXT, IN `IN_PageSize` INT, IN `IN_Date` VARCHAR(10))  READS SQL DATA
BEGIN
DROP TEMPORARY TABLE IF EXISTS temp;
DROP TEMPORARY TABLE IF EXISTS birthdays;

SET @TotalPages = NULL;
SET @TotalItems = NULL;
SET @StartRow = NULL;
SET @EndRow = NULL;
SET @Position = NULL;
SET @Page = NULL;

CREATE TEMPORARY TABLE temp( val VARCHAR(20), INDEX(val) );
SET @SQL = CONCAT("INSERT INTO temp (val) values ('", REPLACE(IN_UserDiscordIds, ",", "'),('"),"');");
PREPARE stmt1 FROM @sql;
EXECUTE stmt1;

SELECT COUNT(*) INTO @TotalItems
FROM temp AS T
JOIN `user`AS U
    ON U.UserDiscordId = T.val
WHERE
    U.Birthday IS NOT NULL AND
    U.Timezone IS NOT NULL;

CREATE TEMPORARY TABLE birthdays
SELECT *
FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (
                ORDER BY U.Birthday
        ) AS 'Position'
    FROM temp AS T
    JOIN `user`AS U
        ON U.UserDiscordId = T.val
    WHERE
        U.Birthday IS NOT NULL AND
        U.Timezone IS NOT NULL
) as birthdays;

SELECT Position
INTO @Position
FROM birthdays
WHERE DATE_FORMAT(birthdays.Birthday, '%m-%d') >= IN_DATE
LIMIT 1;

SELECT CEILING(@TotalItems / IN_PageSize) INTO @TotalPages;

SELECT CEILING(@Position / IN_PageSize) INTO @Page;

SET @StartRow = ((@Page - 1) * IN_PageSize) + 1;
SET @EndRow = @Page * IN_PageSize;

SELECT * FROM birthdays
AS UserData
WHERE
    UserData.Position >= @StartRow AND
    UserData.Position <= @EndRow;

SELECT
    @TotalItems AS 'TotalItems',
    @TotalPages as 'TotalPages',
    @Page as 'Page';
    
DROP TEMPORARY TABLE IF EXISTS temp;
DROP TEMPORARY TABLE IF EXISTS birthdays;
END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetLastVote` (IN `IN_UserDiscordId` VARCHAR(20))  READS SQL DATA
BEGIN

SELECT *
FROM `vote`
WHERE UserDiscordId = IN_UserDiscordId
ORDER BY VoteId DESC LIMIT 1;

END$$

CREATE DEFINER=`admin`@`%` PROCEDURE `User_GetTotalCount` ()  READS SQL DATA
BEGIN

SELECT COUNT(*) AS Total FROM `user`;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `blacklist`
--

CREATE TABLE `blacklist` (
  `BlacklistId` int(11) NOT NULL,
  `GuildId` int(11) NOT NULL,
  `UserDiscordId` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `guild`
--

CREATE TABLE `guild` (
  `GuildId` int(11) NOT NULL,
  `GuildDiscordId` varchar(20) NOT NULL,
  `BirthdayChannelDiscordId` varchar(20) NOT NULL DEFAULT '0',
  `BirthdayRoleDiscordId` varchar(20) DEFAULT '0',
  `TrustedRoleDiscordId` varchar(20) DEFAULT '0',
  `BirthdayMasterRoleDiscordId` varchar(20) DEFAULT '0',
  `MentionSetting` varchar(20) DEFAULT '0',
  `MessageTime` tinyint(4) NOT NULL DEFAULT 0,
  `TrustedPreventsRole` tinyint(1) NOT NULL DEFAULT 1,
  `TrustedPreventsMessage` tinyint(1) NOT NULL DEFAULT 1,
  `UseEmbed` tinyint(1) NOT NULL DEFAULT 1,
  `MessageEmbedColor` varchar(6) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `MessageId` int(11) NOT NULL,
  `GuildId` int(11) DEFAULT NULL,
  `Message` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
  `UserDiscordId` varchar(20) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `UserId` int(11) NOT NULL,
  `UserDiscordId` varchar(20) NOT NULL,
  `Birthday` date DEFAULT NULL,
  `TimeZone` varchar(100) CHARACTER SET utf32 DEFAULT NULL,
  `ChangesLeft` tinyint(4) DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `vote`
--

CREATE TABLE `vote` (
  `VoteId` int(11) NOT NULL,
  `BotSiteName` varchar(50) NOT NULL,
  `UserDiscordId` varchar(20) NOT NULL,
  `VoteTime` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blacklist`
--
ALTER TABLE `blacklist`
  ADD PRIMARY KEY (`BlacklistId`),
  ADD UNIQUE KEY `UQ_GuildIdUserDiscordId` (`GuildId`,`UserDiscordId`) USING BTREE,
  ADD KEY `UserId` (`UserDiscordId`);

--
-- Indexes for table `guild`
--
ALTER TABLE `guild`
  ADD PRIMARY KEY (`GuildId`),
  ADD UNIQUE KEY `DiscordId` (`GuildDiscordId`),
  ADD KEY `GuildDiscordId` (`GuildDiscordId`),
  ADD KEY `BirthdayChannelDiscordId` (`BirthdayChannelDiscordId`),
  ADD KEY `BirthdayRoleDiscordId` (`BirthdayRoleDiscordId`),
  ADD KEY `TrustedRoleDiscordId` (`TrustedRoleDiscordId`),
  ADD KEY `BirthdayMasterRoleDiscordId` (`BirthdayMasterRoleDiscordId`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`MessageId`),
  ADD KEY `FK_Messages_GuildId` (`GuildId`),
  ADD KEY `UserDiscordId` (`UserDiscordId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `UserDiscordId` (`UserDiscordId`),
  ADD KEY `UserDiscordId_2` (`UserDiscordId`);

--
-- Indexes for table `vote`
--
ALTER TABLE `vote`
  ADD PRIMARY KEY (`VoteId`),
  ADD UNIQUE KEY `UQ_BotSiteName_UserDiscordId_VoteTime` (`BotSiteName`,`UserDiscordId`,`VoteTime`) USING BTREE,
  ADD KEY `UserDiscordId` (`UserDiscordId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blacklist`
--
ALTER TABLE `blacklist`
  MODIFY `BlacklistId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guild`
--
ALTER TABLE `guild`
  MODIFY `GuildId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `MessageId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `UserId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vote`
--
ALTER TABLE `vote`
  MODIFY `VoteId` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blacklist`
--
ALTER TABLE `blacklist`
  ADD CONSTRAINT `blacklist_ibfk_1` FOREIGN KEY (`GuildId`) REFERENCES `guild` (`GuildId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;