export enum CelebrationType {
    BIRTHDAY = 'BIRTHDAY',
    MEMBER_ANNIVERSARY = 'MEMBER_ANNIVERSARY',
    SERVER_ANNIVERSARY = 'SERVER_ANNIVERSARY',
    EVENT = 'EVENT',
    USER_SPECIFIC_BIRTHDAY = 'USER_SPECIFIC_BIRTHDAY',
    USER_SPECIFIC_MEMBER_ANNIVERSARY = 'USER_SPECIFIC_MEMBER_ANNIVERSARY',
}

export const ListCelebrationTypes = [CelebrationType.BIRTHDAY, CelebrationType.MEMBER_ANNIVERSARY];

export type ListCelebrationType = CelebrationType.BIRTHDAY | CelebrationType.MEMBER_ANNIVERSARY;

export const MessageListCelebrationTypes = [
    CelebrationType.BIRTHDAY,
    CelebrationType.MEMBER_ANNIVERSARY,
    CelebrationType.SERVER_ANNIVERSARY,
    CelebrationType.EVENT,
    CelebrationType.USER_SPECIFIC_BIRTHDAY,
    CelebrationType.USER_SPECIFIC_MEMBER_ANNIVERSARY,
];

export type MessageListCelebrationType =
    | CelebrationType.BIRTHDAY
    | CelebrationType.MEMBER_ANNIVERSARY
    | CelebrationType.SERVER_ANNIVERSARY
    | CelebrationType.EVENT
    | CelebrationType.USER_SPECIFIC_BIRTHDAY
    | CelebrationType.USER_SPECIFIC_MEMBER_ANNIVERSARY;

export const ViewCelebrationTypes = [CelebrationType.BIRTHDAY, CelebrationType.MEMBER_ANNIVERSARY];

export type ViewCelebrationType = CelebrationType.BIRTHDAY | CelebrationType.MEMBER_ANNIVERSARY;

export const NextCelebrationTypes = [
    CelebrationType.BIRTHDAY,
    CelebrationType.MEMBER_ANNIVERSARY,
    CelebrationType.SERVER_ANNIVERSARY,
    CelebrationType.EVENT,
];

export type NextCelebrationType =
    | CelebrationType.BIRTHDAY
    | CelebrationType.MEMBER_ANNIVERSARY
    | CelebrationType.SERVER_ANNIVERSARY
    | CelebrationType.EVENT;
