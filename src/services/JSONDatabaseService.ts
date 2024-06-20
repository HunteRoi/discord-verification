import type { Snowflake } from "discord.js";
import { Config, JsonDB } from "node-json-db";

import type { IStoringSystem, IUser } from "../types/index.js";

export type UserModel = IUser;

/**
 * The JSON file storing system. Used to store the users.
 *
 * @export
 * @class JSONDatabaseService
 * @implements {IStoringSystem<UserModel>}
 */
export class JSONDatabaseService implements IStoringSystem<UserModel> {
    readonly #database: JsonDB;
    readonly #rootPath: string;

    /**
     * Creates an instance of JSONDatabaseService.
     * @param {string} filePath
     * @memberof JSONDatabaseService
     */
    constructor(filePath: string) {
        this.#rootPath = "/users";
        this.#database = new JsonDB(new Config(filePath, true, true, "/"));
    }

    /**
     * Creates the tables if they do not exist yet.
     *
     * @memberof JSONDatabaseService
     */
    init() {
        if (!this.#database.exists(this.#rootPath)) {
            this.#database.push(this.#rootPath, []);
        }
    }

    /**
     * @inherit
     * @param {Snowflake} userid
     * @return {Promise<UserModel>} the user
     * @memberof JSONDatabaseService
     */
    read(userid: Snowflake): Promise<UserModel | undefined | null> {
        return this.#database.find<UserModel>(
            this.#rootPath,
            (user: UserModel) => user.userid === userid,
        );
    }

    /**
     * @inherit
     * @param {Map<string, any> | ((user: IUser, index: number | string) => boolean)} argument
     * @return {Promise<UserModel>} the user or nothing
     * @memberof JSONDatabaseService
     */
    readBy(
        argument: // biome-ignore lint: a filter could be anything
            | Map<string, any>
            | ((user: UserModel, index: number | string) => boolean),
    ): Promise<UserModel | undefined | null> {
        if (argument instanceof Map) {
            return this.readBy((user) => {
                const isValidProperty = (
                    prop: string,
                ): prop is keyof UserModel => prop in user;

                let returnValue = true;
                for (const [property, value] of argument) {
                    if (isValidProperty(property)) {
                        const dataFromUser = JSON.stringify(user[property]);
                        const dataFromValue = JSON.stringify(value);
                        returnValue =
                            returnValue && dataFromUser === dataFromValue;
                        console.log(dataFromUser, dataFromValue, returnValue);
                    }
                }

                return returnValue;
            });
        }
        return this.#database.find<UserModel>(this.#rootPath, argument);
    }

    /**
     * @inherit
     * @param {UserModel} user
     * @memberof JSONDatabaseService
     */
    async write(user: UserModel): Promise<void> {
        const index = await this.#database.getIndex(
            this.#rootPath,
            user.userid,
            "userid",
        );
        await this.#database.push(
            `${this.#rootPath}[${index !== -1 ? index.toString() : ""}]`,
            user,
            true,
        );
    }
}
