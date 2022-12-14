import { ColorResolvable, EmbedBuilder } from 'discord.js';
import { Linguini, TypeMapper, TypeMappers, Utils } from 'linguini';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LangCode } from '../enums/index.js';

export class Lang {
    public static Default = LangCode.EN_US;

    private static linguiniObjects: { [key: string]: Linguini } = {
        prompts: new Linguini(
            path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang/prompts'),
            'prompts',
            {
                customCommonFile: path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../lang/lang.common.json'
                ),
            }
        ),
        info: new Linguini(
            path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang/info'),
            'info',
            {
                customCommonFile: path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../lang/lang.common.json'
                ),
            }
        ),
        results: new Linguini(
            path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang/results'),
            'results',
            {
                customCommonFile: path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../lang/lang.common.json'
                ),
            }
        ),
        validation: new Linguini(
            path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang/validation'),
            'validation',
            {
                customCommonFile: path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../lang/lang.common.json'
                ),
            }
        ),
        errors: new Linguini(
            path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang/errors'),
            'errors',
            {
                customCommonFile: path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../lang/lang.common.json'
                ),
            }
        ),
    };

    public static getErrorEmbed(
        type: string,
        location: string,
        langCode: LangCode,
        variables?: { [name: string]: string }
    ): EmbedBuilder {
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
    ): EmbedBuilder {
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
    ): EmbedBuilder {
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

    // TODO: Locales
    // public static getRefLocalizationMap(
    //     location: string,
    //     variables?: { [name: string]: string }
    // ): LocalizationMap {
    //     let obj = {};
    //     for (let langCode of Language.Enabled) {
    //         obj[langCode] = this.getRef('info', location, langCode, variables);
    //     }
    //     return obj;
    // }

    public static getCom(location: string, variables?: { [name: string]: string }): string {
        return this.linguiniObjects.info.getCom(location, variables);
    }
    private static successEmbedTm: TypeMapper<EmbedBuilder> = (jsonValue: any) => {
        return new EmbedBuilder({
            description: Utils.join(jsonValue, '\n'),
        }).setColor(Lang.getCom('colors.success') as ColorResolvable);
    };

    private static errorEmbedTm: TypeMapper<EmbedBuilder> = (jsonValue: any) => {
        return new EmbedBuilder({
            description: Utils.join(jsonValue, '\n'),
        }).setColor(Lang.getCom('colors.error') as ColorResolvable);
    };

    private static messageEmbedTm: TypeMapper<EmbedBuilder> = (jsonValue: any) => {
        return new EmbedBuilder({
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
                inline: field.inline ? field.inline : false,
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
