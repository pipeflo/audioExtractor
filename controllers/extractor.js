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
                "Title": {
                    DataType: "String",
                    StringValue: "The Whistler"
                },
                "Author": {
                    DataType: "String",
                    StringValue: "John Grisham"
                },
                "WeeksOn": {
                    DataType: "Number",
                    StringValue: "6"
                }
            },
            MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
            // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
            // MessageGroupId: "Group1",  // Required for FIFO queues
            QueueUrl: "https://sqs.us-east-1.amazonaws.com/876382409379/videos"
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

        /*sqs.listQueues(params, function (err, data) {
            if (err)
            {
                console.log("Error", err);
            } else
            {
                console.log("Success", data.QueueUrls);
                res.status(200).json(data.QueueUrls);
            }
        });*/
    }
}