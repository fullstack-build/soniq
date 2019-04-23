import { createTestAccount, createTransport, getTestMessageUrl } from "nodemailer";
import { htmlToText } from "nodemailer-html-to-text";
import * as Mailgen from "mailgen";

import { QueueFactory } from "@fullstack-one/queue";
import { Service, Inject, Container } from "@fullstack-one/di";
import { Config, IEnvironment } from "@fullstack-one/config";
import { EventEmitter } from "@fullstack-one/events";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";
import { SchemaBuilder } from "@fullstack-one/schema-builder";
import { BootLoader } from "@fullstack-one/boot-loader";

@Service()
export class NotificationsEmail {
  private isReady = false;
  private transport;
  private readonly queueName = "notifications.NotificationsEmail";
  private readonly mailGenerator: Mailgen;

  // DI dependencies
  private readonly config: Config;
  private readonly CONFIG: any;
  private readonly logger: ILogger;
  private readonly queueFactory: QueueFactory;
  @Inject()
  private readonly eventEmitter: EventEmitter;

  constructor(
    @Inject((type) => LoggerFactory) loggerFactory,
    @Inject((type) => QueueFactory) queueFactory,
    @Inject((type) => Config) config,
    @Inject((type) => SchemaBuilder) schemaBuilder,
    @Inject((type) => BootLoader) bootLoader
  ) {
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

  private async boot(): Promise<void> {
    // create transport with settings
    if (this.CONFIG.testing) {
      createTestAccount((err, account) => {
        if (err != null) {
          this.logger.warn("testingAccount.creation.error", err);
          throw err;
        } else {
          this.logger.trace("testingAccount.creation.success", account.user);
        }

        this.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user, // generated ethereal user
            pass: account.pass // generated ethereal password
          }
        });
      });
    } else {
      if (this.CONFIG.transport && this.CONFIG.transport.smtp) {
        this.createTransport(this.CONFIG.transport.smtp);
      }
    }

    try {
      // subscribe to sendmail jobs in queue
      const queue = await this.queueFactory.getQueue();
      queue
        .subscribe(this.queueName, this._sendMail.bind(this))
        .then(() => this.logger.trace("subscribed.job.sendmail.success"))
        .catch((err) => {
          this.logger.warn("subscribed.job.sendmail.error", err);
          throw err;
        });
    } catch (err) {
      this.logger.warn(err);
      throw err;
    }
  }

  private async _sendMail(job: any) {
    const message = job.data;

    try {
      const response = await this.transport.sendMail(message);
      this.logger.trace("sendMessage.transport.sendMail.success", response);
      // extract email url for testing
      if (this.CONFIG.testing) {
        this.logger.trace("testingAccount.sendMail.success.url", getTestMessageUrl(response));
      }

      // send event with email success
      this.eventEmitter.emit(`sendMessage.success.${job.id}`, { jobId: job.id, response });

      // mark job as done
      job
        .done()
        .then(() => this.logger.trace("sendMessage.job.marked.completed.success", job.id))
        .catch((err) => {
          this.logger.warn("sendMessage.job.marked.completed.error", err);
          throw err;
        });

      return response;
    } catch (err) {
      this.logger.warn("sendMessage.transport.sendMail.error", err.message);
      this.eventEmitter.emit(`sendMessage.error.${job.id}`, { jobId: job.id, response: err });
      throw err;
    }
  }

  // create transport
  private async createTransport(credentials: object) {
    // create reusable transporter object using the default SMTP transport
    this.transport = createTransport(credentials);
    this.transport.use("compile", htmlToText(this.CONFIG.htmlToText));
    this.isReady = true;
    this.eventEmitter.emit("transport.ready");
    this.logger.trace("transport.ready");
  }

  public async sendMessage(
    to: string,
    subject: string,
    html: string,
    text: string = null,
    attachments: undefined[] = [],
    from?: string,
    jobOptions: any = {}
  ): Promise<any> {
    // todo: jobOptions: use pg-boss interface here

    if (this.isReady) {
      // Message object
      const message = { from, to, subject, html, text };

      try {
        const finalJobOptions = {
          ...jobOptions,
          ...this.CONFIG.queue // override method jobOptions if they interfere
        };

        // create sendmail job in queue
        const queue = await this.queueFactory.getQueue();
        const jobId = await queue.publish(this.queueName, message, finalJobOptions);
        this.logger.trace("sendMessage.job.creation.success", jobId);
        return jobId;
      } catch (err) {
        this.logger.warn("sendMessage.job.creation.error", err);
        throw err;
      }
    } else {
      // retry sending message when transport is ready
      this.eventEmitter.on("transport.ready", async () => {
        return this.sendMessage(to, subject, html, text, attachments, from);
      });
    }
  }

  public async sendTemplateMail(
    to: string,
    subject: string,
    template: any,
    text: string = null,
    attachments: undefined[] = [],
    from?: string,
    jobOptions: any = {}
  ): Promise<any> {
    // Generate an HTML email with the provided contents
    const emailBody = this.generateHtmlFromTemplate(template);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    const emailText = this.generatePlaintextFromTemplate(template, text);

    return this.sendMessage(to, subject, emailBody, emailText, attachments, from, jobOptions);
  }

  public generateHtmlFromTemplate(template: Mailgen.Content): any {
    return this.mailGenerator.generate(template);
  }

  public generatePlaintextFromTemplate(template: Mailgen.Content, text: string = null): any {
    return text || this.mailGenerator.generatePlaintext(template);
  }
}
