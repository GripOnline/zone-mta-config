'use strict';

// DNS entry
// test._domainkey.example.com:v=DKIM1;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDVb7eRJNfQrfnEr6GyZaRq1JxbxQh5+h+4D2OseH2t/vii+8OXvkpApTUEO2woJ1tbeNSGinnxfWnxZpoZaCjrhqJHrtFR6pQFcD/FnT92w5eyru+kq5yLAv+IXlZXvJXoOw9gN3NwBJ6p+EqC1/1hsOl4dedDFd/xmMlHk6wj8wIDAQAB

// Sent message should have a signature like the following:
/*
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com;
 q=dns/txt; s=test; bh=VRtPFKW6BFIbUeboSJtHw3z5AVJGV/i9RPj/ISlIzAk=;
 h=subject:date:message-id;
 b=BQsM8Qso5gSYpBHOCb2MVc0cW5QRnF4upuIWfE4CcpQHIPKuxJF+u4ToFKvkhnqAqqOHMcB5z
 V3Vr4Loj7ozCtn/rfSXiyY8sOoaYqqcUBgjuKdJ0gUNySb4ADKfgfyhREf117c6OjajQRenMO9r
 +rdBEDvBOD9Bxc2KzVUhyfE=
*/

module.exports.title = 'DKIM Mapped Signing';

module.exports.init = (app, done) => {

    app.addHook('sender:connection', (delivery, connection, next) => {
        // make sure that there is a key array present
        if (!delivery.dkim.keys) {
            delivery.dkim.keys = [];
        }

        // resolve the domain name of the sender
        const fromDomain = (delivery.from || 'localhost').split('@').pop().toLowerCase();

        if (app.config.signingTable) {

            app.config.signingTable.forEach((pair) => {

                if (pair[0] == fromDomain) {

                    // push all signature keys to the key array
                    delivery.dkim.keys.push({
                        domainName: pair[0],
                        keySelector: pair[1],
                        privateKey: pair[2]
                    });

                    app.logger.info('DKIM', '%s.%s Added DKIM key for %s <%s>', delivery.id, delivery.seq, fromDomain, delivery.messageId);

                }

            });

        }

        next();

    });

    done();
};
