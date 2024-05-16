'use strict';

const fetch = require('nodemailer/lib/fetch');

module.exports.title = 'Webhook Notification';
module.exports.init = function(app, done) {

    // Send bounce notification to a HTTP url
    app.addHook('queue:bounce', (bounce, maildrop, next) => {

        let retries = 0;
        let body = {
            id: bounce.id,
            sessionId: bounce.sessionId,
            to: bounce.to,
            seq: bounce.seq,
            returnPath: bounce.from,
            category: bounce.category,
            time: bounce.time,
            response: bounce.response
        };

        let messageId = bounce.headers.getFirst('Message-ID');

        if (messageId) {
            body.messageId = messageId;
        }

        let webhookUrl;

        let fromAddress = bounce.from;

        if (fromAddress) {

            if (fromAddress.includes('@')) {

                let fromDomain = fromAddress.substring(fromAddress.lastIndexOf('@') + 1);

                if (fromDomain) {

                    if (app.config.webhookUrls) {

                        app.config.webhookUrls.forEach((pair) => {

                            if (pair[0] == fromDomain) {

                                webhookUrl = pair[1];

                            }

                        });

                    }

                    // app.logger.info('Webhookurl: ', webhookUrl);

                }

            }

        }

        let notifyBounce = () => {
            // send bounce information
            let returned;
            let stream = fetch(webhookUrl, {
                body: JSON.stringify(body)
            });

            stream.on('readable', () => {
                while (stream.read() !== null) {
                    // ignore
                }
            });

            stream.once('error', err => {
                if (returned) {
                    return;
                }
                returned = true;
                app.logger.error('HTTPBounce[' + process.pid + ']', 'Could not send bounce info');
                app.logger.error('HTTPBounce[' + process.pid + ']', err.message);
                if (retries++ <= 5) {
                    setTimeout(notifyBounce, Math.pow(retries, 2) * 1000).unref();
                } else {
                    next();
                }
            });

            stream.on('end', () => {
                if (returned) {
                    return;
                }
                returned = true;
                next();
            });

        };

        if (webhookUrl) {

            app.logger.info('Notifying bounce via ' + webhookUrl);

            setImmediate(notifyBounce);

        } else {

            next();

        }

    });

    // Send bounce notification to a HTTP url
    app.addHook('sender:delivered', (delivery, info, next) => {

        // app.logger.info('detected delivery', delivery, info);

        let retries = 0;
        let body = {
            id: delivery.id,
            sessionId: delivery.sessionId,
            to: delivery.to,
            // seq: delivery.seq,
            returnPath: delivery.from,
            // category: delivery.category,
            time: delivery.time,
            status: delivery.status,
            info: info,
        };

        let messageId = delivery.headers.getFirst('Message-ID');

        if (messageId) {
            body.messageId = messageId;
        }

        let webhookUrl;

        let fromAddress = delivery.parsedEnvelope.from;

        if (fromAddress) {

            if (fromAddress.includes('@')) {

                let fromDomain = fromAddress.substring(fromAddress.lastIndexOf('@') + 1);

                if (fromDomain) {

                    if (app.config.webhookUrls) {

                        app.config.webhookUrls.forEach((pair) => {

                            if (pair[0] == fromDomain) {

                                webhookUrl = pair[1];

                            }

                        });

                    }

                }

            }

        }

        let notifyDelivery = () => {
            // send delivery information

            let returned;
            let stream = fetch(webhookUrl, {
                body: JSON.stringify(body)
            });

            stream.on('readable', () => {
                while (stream.read() !== null) {
                    // ignore
                }
            });

            stream.once('error', err => {
                if (returned) {
                    return;
                }
                returned = true;
                app.logger.error('HTTPBounce[' + process.pid + ']', 'Could not send delivery info to ' + webhookUrl);
                app.logger.error('HTTPBounce[' + process.pid + ']', err.message);
                if (retries++ <= 5) {
                    setTimeout(notifyDelivery, Math.pow(retries, 2) * 1000).unref();
                } else {
                    next();
                }
            });

            stream.on('end', () => {
                if (returned) {
                    return;
                }
                returned = true;
                next();
            });

        };

        if (webhookUrl) {

            app.logger.info('Notifying delivery via ' + webhookUrl);

            setImmediate(notifyDelivery);

        } else {

            next();

        }

    });

    /*
    app.addHook('message:headers', async (envelope, messageInfo, next) => {

        let webhookUrl = envelope.headers.getFirst("X-Webhook-Url");

        if (webhookUrl) {

            app.logger.info('webhook-url found: ' + webhookUrl);

            envelope.webhookUrl = webhookUrl;

        }

        // app.logger.info('envelope.headers:', envelope.headers);

        envelope.headers.remove("X-Webhook-Url");

        next();

    });
    */

    done();

};
