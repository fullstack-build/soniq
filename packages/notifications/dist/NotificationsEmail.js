"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = require("nodemailer");
const nodemailer_html_to_text_1 = require("nodemailer-html-to-text");
const Mailgen = require("mailgen");
const queue_1 = require("@fullstack-one/queue");
const di_1 = require("@fullstack-one/di");
const config_1 = require("@fullstack-one/config");
const events_1 = require("@fullstack-one/events");
const logger_1 = require("@fullstack-one/logger");
const schema_builder_1 = require("@fullstack-one/schema-builder");
const boot_loader_1 = require("@fullstack-one/boot-loader");
let NotificationsEmail = class NotificationsEmail {
    constructor(loggerFactory, queueFactory, config, schemaBuilder, bootLoader) {
        this.isReady = false;
        this.queueName = "notifications.NotificationsEmail";
        // set DI dependencies
        this.queueFactory = queueFactory;
        this.config = config;
        // register package config
        const notificationsConfig = this.config.registerConfig("Notifications", `${__dirname}/../config`);
        this.CONFIG = notificationsConfig.Email;
        this.logger = loggerFactory.create(this.constructor.name);
        // create Mailgen
        this.mailGenerator = new Mailgen(this.CONFIG.mailgen);
        // add migration path
        schemaBuilder.getDbSchemaBuilder().addMigrationPath(`${__dirname}/..`);
        // add to boot loader
        bootLoader.addBootFunction(this.constructor.name, this.boot.bind(this));
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            // create transport with settings
            if (this.CONFIG.testing) {
                nodemailer_1.createTestAccount((err, account) => {
                    if (err != null) {
                        this.logger.warn("testingAccount.creation.error", err);
                        throw err;
                    }
                    else {
                        this.logger.trace("testingAccount.creation.success", account.user);
                    }
                    this.createTransport({
                        host: account.smtp.host,
                        port: account.smtp.port,
                        secure: account.smtp.secure,
                        auth: {
                            user: account.user,
                            pass: account.pass // generated ethereal password
                        }
                    });
                });
            }
            else {
                if (this.CONFIG.transport && this.CONFIG.transport.smtp) {
                    this.createTransport(this.CONFIG.transport.smtp);
                }
            }
            try {
                // subscribe to sendmail jobs in queue
                const queue = yield this.queueFactory.getQueue();
                queue
                    .subscribe(this.queueName, this._sendMail.bind(this))
                    .then(() => this.logger.trace("subscribed.job.sendmail.success"))
                    .catch((err) => {
                    this.logger.warn("subscribed.job.sendmail.error", err);
                    throw err;
                });
            }
            catch (err) {
                this.logger.warn(err);
                throw err;
            }
        });
    }
    _sendMail(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = job.data;
            try {
                const mailInfo = yield this.transport.sendMail(message);
                this.logger.trace("sendMessage.transport.sendMail.success", mailInfo);
                // extract email url for testing
                if (this.CONFIG.testing) {
                    this.logger.trace("testingAccount.sendMail.success.url", nodemailer_1.getTestMessageUrl(mailInfo));
                }
                // send event with email success
                this.eventEmitter.emit(`sendMessage.success.${job.id}`);
                // mark job as done
                job
                    .done()
                    .then(() => this.logger.trace("sendMessage.job.marked.completed.success", job.id))
                    .catch((err) => {
                    this.logger.warn("sendMessage.job.marked.completed.error", err);
                    throw err;
                });
                return mailInfo;
            }
            catch (err) {
                this.logger.warn("sendMessage.transport.sendMail.error", err.message);
                this.eventEmitter.emit(`sendMessage.error.${job.id}`);
                throw err;
            }
        });
    }
    // create transport
    createTransport(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            // create reusable transporter object using the default SMTP transport
            this.transport = nodemailer_1.createTransport(credentials);
            this.transport.use("compile", nodemailer_html_to_text_1.htmlToText(this.CONFIG.htmlToText));
            this.isReady = true;
            this.eventEmitter.emit("transport.ready");
            this.logger.trace("transport.ready");
        });
    }
    sendMessage(to, subject, html, text = null, attachments = [], from, jobOptions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // todo: jobOptions: use pg-boss interface here
            if (this.isReady) {
                // Message object
                const message = { from, to, subject, html, text };
                try {
                    const finalJobOptions = Object.assign({}, jobOptions, this.CONFIG.queue // override method jobOptions if they interfere
                    );
                    // create sendmail job in queue
                    const queue = yield this.queueFactory.getQueue();
                    const jobId = yield queue.publish(this.queueName, message, finalJobOptions);
                    this.logger.trace("sendMessage.job.creation.success", jobId);
                    return jobId;
                }
                catch (err) {
                    this.logger.warn("sendMessage.job.creation.error", err);
                    throw err;
                }
            }
            else {
                // retry sending message when transport is ready
                this.eventEmitter.on("transport.ready", () => __awaiter(this, void 0, void 0, function* () {
                    return this.sendMessage(to, subject, html, text, attachments, from);
                }));
            }
        });
    }
    sendTemplateMail(to, subject, template, text = null, attachments = [], from, jobOptions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate an HTML email with the provided contents
            const emailBody = this.mailGenerator.generate(template);
            // Generate the plaintext version of the e-mail (for clients that do not support HTML)
            const emailText = text || this.mailGenerator.generatePlaintext(template);
            return this.sendMessage(to, subject, emailBody, emailText, attachments, from, jobOptions);
        });
    }
};
__decorate([
    di_1.Inject(),
    __metadata("design:type", events_1.EventEmitter)
], NotificationsEmail.prototype, "eventEmitter", void 0);
NotificationsEmail = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject((type) => logger_1.LoggerFactory)),
    __param(1, di_1.Inject((type) => queue_1.QueueFactory)),
    __param(2, di_1.Inject((type) => config_1.Config)),
    __param(3, di_1.Inject((type) => schema_builder_1.SchemaBuilder)),
    __param(4, di_1.Inject((type) => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], NotificationsEmail);
exports.NotificationsEmail = NotificationsEmail;