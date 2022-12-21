## MISC Commands
- /view [type] (default: birthday, member_anniversary, server_anniversary) - Done
- /next [type] (default: birthday, member_anniversary) - Done
- /link <type> (support, docs, donate, faq, invite, vote, map) - Done
- /settings [type] (default: general, event, advanced)
- /help [category]
- /purge - In Progress
- /set [date] [time zone] - In Progress
- /suggest <user> [date] [time zone]
- /info <choice> - Done
- /premium - Done
- /subscribe
- /vote
- /map - Done

## MISC Setting Commands
- /setup 
- /test <type> [user] [year] 
	- type: birthday, member_anniversary, server_anniversary. user: only for birthdays and member anniversaries. year: only for member/server anniversaries)



## List commands
- /list [type] [page] (default: birthday, member_anniversary)
- /view_messages <type> [page] // All celebration types accepted
- /view_blacklist [page]
- /view_trusted_role [page]
- /view_member_anniversary_roles [page]
- /view_custom_events [page]
	- Shows the date, alias, and message alias, and all message properties

## Config Commands
- /config timezone <timezone>
- /config nameFormat <nameFormat>
- /config dateFormat <dateFormat>
- /config useTimezone <useTimezone>
- /config trustedPreventsRole <true/false>
- /config trustedPreventsMessage <true/false>
- /config requireAllTrustedRoles <true/false>

## Event Commands (type includes: birthday, memeber_anniversary, server_anniversary, custom_event)
- /event ping <type> <ping>
- /event time <type> <0-23>
- /event post_mode <type> <post_mode>
- /event channel <type> <channel> 

## Custom Event Commands
/custom_event add <date>
/custom_event remove <alias>
/custom_event test <event_number>
/custom_event set_message <event_alias> <message_alias>

## Trusted Role commands
- /trusted_role add <role>
- /blacklist remove <id>
- /trusted_role clear

## Blacklist Commands
- /blacklist add <role_or_user>
- /blacklist remove <id>
- /blacklist clear

## Member Anniversary Role Commands
- /mar add <role> <year>
- /mar remove <year>
- /mar clear

## Message commands
- /message add <type>
	- asks for description
	- asks for image (link or {USER_PFP} if birthday / member anniversary, server anniversary can use {SERVER_ICON})
		- Give these options through buttons based on the type
	- asks for embed (true/false)
	- asks for color (if premium & embed = true)
	- asks for title (if premium & embed = true)
	- asks for footer (if premium & embed = true)
- /message remove <alias>
- /message clear <type>
- /message edit decription <alias> <new_description>
- /message edit embed <alias> <true/false>
- /message edit image <alias> <new_image>
- /message edit title <alias> <title>
- /message edit footer <alias> <new_footer>
- /message test <alias>

## Permanent List Commands
- /permanent_list generate <type> [channel]
	- Generates a permanent list of all birthdays or member anniversaries
	- defaults to the channel the command was run in
	- Server can only have one permanent list at a time
	- If a permanent list already exists, the database id will be overwritten
	- No command to remove, the server can just delete the message?