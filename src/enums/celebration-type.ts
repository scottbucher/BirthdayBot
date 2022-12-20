export enum CelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    MEMBER_ANNIVERSARY = 'MEMBER_ANNIVERSARY',
    SERVER_ANNIVERSARY = 'SERVER_ANNIVERSARY',
    EVENT = 'EVENT',
}

export enum ListCelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    MEMBER_ANNIVERSARY = 'MEMBER_ANNIVERSARY',
}

export enum MessageListCelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    MEMBER_ANNIVERSARY = 'MEMBER_ANNIVERSARY',
    SERVER_ANNIVERSARY = 'SERVER_ANNIVERSARY',
    USER_SPECIFIC_BIRTHDAY = 'USER_SPECIFIC_BIRTHDAY',
    USER_SPECIFIC_MEMBER_ANNIVERSARY = 'USER_SPECIFIC_MEMBER_ANNIVERSARY',
}

// Duplicate of ListCelebrationType but is for a different purpose if we ever need to change it
export enum ViewCelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    MEMBER_ANNIVERSARY = 'MEMBER_ANNIVERSARY',
}
