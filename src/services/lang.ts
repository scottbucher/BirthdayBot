import { ColorResolvable, MessageEmbed } from 'discord.js';
import { Linguini, TypeMapper, TypeMappers, Utils } from 'linguini';

import path from 'path';
import { LangCode } from '../models/enums';

export class Lang {
    public static Default = LangCode.EN_US;

    private static linguiniObjects: { [key: string]: Linguini } = {
        prompts: new Linguini(path.resolve(__dirname, '../../lang/prompts'), 'prompts', {
            customCommonFile: path.resolve(__dirname, '../../lang/lang.common.json'),
        }),
        info: new Linguini(path.resolve(__dirname, '../../lang/info'), 'info', {
            customCommonFile: path.resolve(__dirname, '../../lang/lang.common.json'),
        }),
        results: new Linguini(path.resolve(__dirname, '../../lang/results'), 'results', {
            customCommonFile: path.resolve(__dirname, '../../lang/lang.common.json'),
        }),
        validation: new Linguini(path.resolve(__dirname, '../../lang/validation'), 'validation', {
            customCommonFile: path.resolve(__dirname, '../../lang/lang.common.json'),
        }),
        errors: new Linguini(path.resolve(__dirname, '../../lang/errors'), 'errors', {
            customCommonFile: path.resolve(__dirname, '../../lang/lang.common.json'),
        }),
    };

    public static getErrorEmbed(
        type: string,
        location: string,
        langCode: LangCode,
        variables?: { [name: string]: string }
    ): MessageEmbed {
        return (
            this.linguiniObjects[type].get(location, langCode, this.errorEmbedTm, variables) ??
            this.linguiniObjects[type].get(location, this.Default, this.errorEmbedTm, variables)
        );
    }

    public static getSuccessEmbed(
        type: string,
        location: string,
        langCode: LangCode,
        variables?: { [name: string]: string }
    ): MessageEmbed {
        return (
            this.linguiniObjects[type].get(location, langCode, this.successEmbedTm, variables) ??
            this.linguiniObjects[type].get(location, this.Default, this.successEmbedTm, variables)
        );
    }

    public static getEmbed(
        type: string,
        location: string,
        langCode: LangCode,
        variables?: { [name: string]: string }
    ): MessageEmbed {
        return (
            this.linguiniObjects[type].get(location, langCode, this.messageEmbedTm, variables) ??
            this.linguiniObjects[type].get(location, this.Default, this.messageEmbedTm, variables)
        );
    }

    public static getRegex(type: string, location: string, langCode: LangCode): RegExp {
        return (
            this.linguiniObjects[type].get(location, langCode, TypeMappers.RegExp) ??
            this.linguiniObjects[type].get(location, this.Default, TypeMappers.RegExp)
        );
    }

    public static getRef(
        type: string,
        location: string,
        langCode: LangCode,
        variables?: { [name: string]: string }
    ): string {
        return (
            this.linguiniObjects[type].getRef(location, langCode, variables) ??
            this.linguiniObjects[type].getRef(location, this.Default, variables)
        );
    }

    public static getCom(location: string, variables?: { [name: string]: string }): string {
        return this.linguiniObjects.info.getCom(location, variables);
    }
    private static successEmbedTm: TypeMapper<MessageEmbed> = (jsonValue: any) => {
        return new MessageEmbed({
            description: jsonValue,
            color: Lang.getCom('colors.success') as ColorResolvable,
        });
    };

    private static errorEmbedTm: TypeMapper<MessageEmbed> = (jsonValue: any) => {
        return new MessageEmbed({
            description: jsonValue,
            color: Lang.getCom('colors.error') as ColorResolvable,
        });
    };

    private static messageEmbedTm: TypeMapper<MessageEmbed> = (jsonValue: any) => {
        return new MessageEmbed({
            author: jsonValue.author,
            title: Utils.join(jsonValue.title, '\n'),
            url: jsonValue.url,
            thumbnail: {
                url: jsonValue.thumbnail,
            },
            description: Utils.join(jsonValue.description, '\n'),
            fields: jsonValue.fields?.map(field => ({
                name: Utils.join(field.name, '\n'),
                value: Utils.join(field.value, '\n'),
            })),
            image: {
                url: jsonValue.image,
            },
            footer: {
                text: Utils.join(jsonValue.footer?.text, '\n'),
                iconURL: jsonValue.footer?.icon,
            },
            timestamp: jsonValue.timestamp ? Date.now() : undefined,
            color: jsonValue.color ?? Lang.getCom('colors.default'),
        });
    };
}
