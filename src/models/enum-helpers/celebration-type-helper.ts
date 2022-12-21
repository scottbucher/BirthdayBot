import { Locale, LocalizationMap } from 'discord.js';

import {
    CelebrationType,
    ListCelebrationType,
    MessageListCelebrationType,
    NextCelebrationType,
    ViewCelebrationType,
} from '../../enums/index.js';
import { Lang } from '../../services/index.js';

const birthdayData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef('commands', 'celebrationTypeChoices.birthday', langCode);
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.birthday');
    },
};

const memberAnniversaryData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef('commands', 'celebrationTypeChoices.memberAnniversary', langCode);
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.memberAnniversary');
    },
};

const serverAnniversaryData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef('commands', 'celebrationTypeChoices.serverAnniversary', langCode);
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.serverAnniversary');
    },
};

const eventData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef('commands', 'celebrationTypeChoices.event', langCode);
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.event');
    },
};

const userSpecificBirthdayData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef('commands', 'celebrationTypeChoices.userSpecificBirthday', langCode);
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap(
            'commands',
            'celebrationTypeChoices.userSpecificBirthday'
        );
    },
};

const userSpecificMemberAnniversaryData: CelebrationTypeData = {
    displayName(langCode: Locale): string {
        return Lang.getRef(
            'commands',
            'celebrationTypeChoices.userSpecificMemberAnniversary',
            langCode
        );
    },
    localizationMap(): LocalizationMap {
        return Lang.getRefLocalizationMap(
            'commands',
            'celebrationTypeChoices.userSpecificMemberAnniversary'
        );
    },
};

interface CelebrationTypeData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class CelebrationTypeHelper {
    public static Data: {
        [key in CelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: birthdayData,
        MEMBER_ANNIVERSARY: memberAnniversaryData,
        SERVER_ANNIVERSARY: serverAnniversaryData,
        EVENT: eventData,
        USER_SPECIFIC_BIRTHDAY: userSpecificBirthdayData,
        USER_SPECIFIC_MEMBER_ANNIVERSARY: userSpecificMemberAnniversaryData,
    };
}

export class ListCelebrationTypeHelper {
    public static Data: {
        [key in ListCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: birthdayData,
        MEMBER_ANNIVERSARY: memberAnniversaryData,
    };
}

export class ViewCelebrationTypeHelper {
    public static Data: {
        [key in ViewCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: birthdayData,
        MEMBER_ANNIVERSARY: memberAnniversaryData,
    };
}

export class NextCelebrationTypeHelper {
    public static Data: {
        [key in NextCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: birthdayData,
        MEMBER_ANNIVERSARY: memberAnniversaryData,
        SERVER_ANNIVERSARY: serverAnniversaryData,
        EVENT: eventData,
    };
}

export class MessageListCelebrationTypeHelper {
    public static Data: {
        [key in MessageListCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: birthdayData,
        MEMBER_ANNIVERSARY: memberAnniversaryData,
        SERVER_ANNIVERSARY: serverAnniversaryData,
        EVENT: eventData,
        USER_SPECIFIC_BIRTHDAY: userSpecificBirthdayData,
        USER_SPECIFIC_MEMBER_ANNIVERSARY: userSpecificMemberAnniversaryData,
    };
}
