/// <reference types="node" />
import { FastifyMultipartBaseOptions } from "fastify-multipart";
import { FastifyPluginAsync } from "fastify";
import AdminJS from "adminjs";
import FastifySessionPlugin from "@fastify/session";
export declare class WrongArgumentError extends Error {
    constructor(message: string);
}
export declare type AuthenticationOptions = {
    cookiePassword: string;
    cookieName?: string;
    cookieSecure?: boolean;
    authenticate: (email: string, password: string) => unknown | null;
};
export declare type AdminRouterOptions = {
    admin: AdminJS;
    auth?: AuthenticationOptions;
    multipartOptions?: FastifyMultipartBaseOptions;
    sessionOptions?: FastifySessionPlugin.Options;
};
export declare const adminRoute: FastifyPluginAsync<AdminRouterOptions>;
declare module "fastify" {
    interface Session {
        adminUser: any;
        redirectTo: string;
    }
}
declare const _default: {
    name: string;
    adminRoute: FastifyPluginAsync<AdminRouterOptions, import("http").Server>;
};
export default _default;
