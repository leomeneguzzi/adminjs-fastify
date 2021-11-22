"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoute = exports.WrongArgumentError = void 0;
const tslib_1 = require("tslib");
const fastify_multipart_1 = (0, tslib_1.__importDefault)(require("fastify-multipart"));
const adminjs_1 = require("adminjs");
const session_1 = (0, tslib_1.__importDefault)(require("@fastify/session"));
const fastify_cookie_1 = (0, tslib_1.__importDefault)(require("fastify-cookie"));
const fastify_formbody_1 = (0, tslib_1.__importDefault)(require("fastify-formbody"));
const mime_1 = (0, tslib_1.__importDefault)(require("mime"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
// const INVALID_ADMINJS_INSTANCE =
// "You have to pass an instance of AdminJS to `adminRoute` plugin"
class WrongArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = "WrongArgumentError";
    }
}
exports.WrongArgumentError = WrongArgumentError;
const adminRoute = async (fastify, { admin, auth, multipartOptions, sessionOptions }) => {
    // if (!(admin instanceof AdminJS)) {
    //   throw new WrongArgumentError(INVALID_ADMINJS_INSTANCE)
    // }
    admin.initialize().then(() => {
        fastify.log.debug("AdminJS: bundle ready");
    });
    const { loginPath, logoutPath, rootPath } = admin.options;
    fastify.register(fastify_multipart_1.default, multipartOptions);
    fastify.register(fastify_formbody_1.default);
    if (auth) {
        await fastify.register(fastify_cookie_1.default);
        await fastify.register(session_1.default, Object.assign(Object.assign({}, sessionOptions), { secret: auth.cookiePassword, cookieName: auth.cookieName || "adminjs", cookie: { secure: auth.cookieSecure || false } }));
        // login
        fastify.get(loginPath, async (req, reply) => {
            const login = await admin.renderLogin({
                action: admin.options.loginPath,
                errorMessage: null,
            });
            reply.type("text/html").send(login);
        });
        fastify.post(loginPath, async (req, reply) => {
            const { email, password } = req.body;
            const adminUser = await auth.authenticate(email, password);
            if (adminUser) {
                req.session.adminUser = adminUser;
                if (req.session.redirectTo) {
                    reply.redirect(302, req.session.redirectTo);
                }
                else {
                    reply.redirect(302, rootPath);
                }
            }
            else {
                const login = await admin.renderLogin({
                    action: admin.options.loginPath,
                    errorMessage: "invalidCredentials",
                });
                reply.type("text/html").send(login);
            }
        });
        // logout
        fastify.get(logoutPath, async (request, reply) => {
            if (request.session.adminUser) {
                request.destroySession((err) => {
                    if (err) {
                        reply.status(500);
                        reply.send('Internal Server Error');
                    }
                    else {
                        reply.redirect(loginPath);
                    }
                });
            }
        });
        // hook
        fastify.addHook('preHandler', (req, reply, next) => {
            if (adminjs_1.Router.assets.find((asset) => req.url.match(asset.path))) {
                return next();
            }
            else if (req.session.adminUser ||
                // these routes doesn't need authentication
                req.url.startsWith(loginPath) ||
                req.url.startsWith(logoutPath)) {
                return next();
            }
            else {
                // If the redirection is caused by API call to some action just redirect to resource
                const [redirectTo] = req.url.split("/actions");
                const apiPath = path_1.default.join(rootPath, '/api');
                req.session.redirectTo = redirectTo.includes(apiPath)
                    ? rootPath
                    : redirectTo;
                return reply.redirect(loginPath);
            }
        });
    }
    const { routes, assets } = adminjs_1.Router;
    routes.forEach((route) => {
        const fullPath = path_1.default.join("/", rootPath, route.path.replace(/{/g, ":").replace(/}/g, ""));
        const fastifyRoute = {
            method: route.method,
            // we have to change routes defined in AdminJS from {recordId} to :recordId
            url: fullPath,
            handler: async (request, reply) => {
                var e_1, _a;
                const controller = new route.Controller({ admin }, request.session && request.session.adminUser);
                let payload = {};
                try {
                    const parts = request.parts();
                    try {
                        for (var parts_1 = (0, tslib_1.__asyncValues)(parts), parts_1_1; parts_1_1 = await parts_1.next(), !parts_1_1.done;) {
                            const part = parts_1_1.value;
                            if (part.file) {
                                payload[part.filename] = part.file;
                            }
                            else {
                                const { value } = part;
                                payload[part.fieldname] = value;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (parts_1_1 && !parts_1_1.done && (_a = parts_1.return)) await _a.call(parts_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                catch (error) {
                    payload = request.body;
                }
                const html = await controller[route.action]({
                    params: request.params,
                    query: request.query,
                    payload,
                    method: request.method.toLowerCase(),
                });
                if (route.contentType) {
                    reply.header("Content-Type", route.contentType);
                }
                else if (typeof html === "string") {
                    reply.header("Content-Type", "text/html");
                }
                if (html) {
                    reply.send(html);
                }
            },
        };
        fastify.route(fastifyRoute);
    });
    assets.forEach((asset) => {
        const fullPath = path_1.default.join(rootPath, asset.path);
        fastify.get(fullPath, (req, reply) => {
            const type = mime_1.default.getType(path_1.default.resolve(asset.src)) || "text/plain";
            const file = fs_1.default.readFileSync(path_1.default.resolve(asset.src));
            reply.type(type).send(file);
        });
    });
};
exports.adminRoute = adminRoute;
exports.default = { name: "AdminJSFastify", adminRoute: exports.adminRoute };
//# sourceMappingURL=index.js.map