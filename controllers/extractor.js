var https = require('https')
    , AWS = require('aws-sdk')
    , mysql = require('mysql')
    , con = mysql.createConnection({
        host: "localhost",
        user: "yourusername",
        password: "yourpassword",
        database: "mydb"
    });
;
AWS.config.update({ region: 'us-east-1' });
AWS.config.credentials = new AWS.EC2MetadataCredentials();
var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
var queueUrl = "https://sqs.us-east-1.amazonaws.com/876382409379/videos";

module.exports = {
    getStream: function (req, res) {
        var options = {
            hostname: 'apps.na.collabserv.com',
            port: 443,
            path: '/connections/opensocial/oauth/rest/activitystreams/@me/@all',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + req.oauthConnections.accessToken }
        };

        var req = https.request(options, function (respuesta) {
            var body = '';
            respuesta.on('data', (d) => {
                body += d;
            }).on('end', function () {
                if (respuesta.statusCode == 200)
                {
                    var parsed = JSON.parse(body);
                    res.status(200).json(parsed);
                    return;
                } else
                {
                    res.status(respuesta.statusCode).send(body);
                }
            });
        });
        req.end();

        req.on('error', (e) => {
            console.error(e);
            res.status(500).json({
                "message": "Error buscando información, por favor intente de nuevo!"
            });
        });
    }
    , getCommunityStream: function (req, res) {
        var options = {
            hostname: 'apps.na.collabserv.com',
            port: 443,
            path: '/connections/opensocial/oauth/rest/activitystreams/urn:lsid:lconn.ibm.com:communities.community:' + req.params.communityId + '/@all',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + req.oauthConnections.accessToken }
        };

        var req = https.request(options, function (respuesta) {
            var body = '';
            respuesta.on('data', (d) => {
                body += d;
            }).on('end', function () {
                if (respuesta.statusCode == 200)
                {
                    var parsed = JSON.parse(body);
                    res.status(200).json(parsed);
                    return;
                } else
                {
                    res.status(respuesta.statusCode).send(body);
                }
            });
        });
        req.end();

        req.on('error', (e) => {
            console.error(e);
            res.status(500).json({
                "message": "Error buscando información de stream de comunidad, por favor intente de nuevo!"
            });
        });
    }
    , insertRequest: function (req, res) {
        console.log("Entró al Controller");
        var params = {
            // Remove DelaySeconds parameter and value for FIFO queues
            MessageAttributes: {
                "videoName": {
                    DataType: "String",
                    StringValue: req.body.source.name
                }
            },
            MessageBody: req.body.source.id,
            // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
            // MessageGroupId: "Group1",  // Required for FIFO queues
            QueueUrl: queueUrl
        };

        sqs.sendMessage(params, function (err, data) {
            if (err)
            {
                console.log("Error", err);
                res.status(500).json({
                    "message": "Error escribiendo en la Cola de Videos"
                });
            } else
            {
                console.log("Success", data.MessageId);
                res.status(200).json(data.MessageId);
            }
        });
    }
    , getVideosFromQueue: function (req, res) {
        console.log("Entró al Controller de listar videos en cola");
        var params = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 1,
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: queueUrl,
            VisibilityTimeout: 20,
            WaitTimeSeconds: 0
        };

        sqs.receiveMessage(params, function (err, data) {
            if (err)
            {
                console.log("Receive Error", err);
                res.status(500).json({
                    "message": "Error recibiendo mensajes de cola de videos"
                });
            } else if (data.Messages)
            {
                console.log("Success", data.Messages[0]);
                res.status(200).json(data.Messages[0]);
                /*var deleteParams = {
                    QueueUrl: queueURL,
                    ReceiptHandle: data.Messages[0].ReceiptHandle
                };
                sqs.deleteMessage(deleteParams, function (err, data) {
                    if (err)
                    {
                        console.log("Delete Error", err);
                    } else
                    {
                        console.log("Message Deleted", data);
                    }
                });*/
            }
        });
    }
}