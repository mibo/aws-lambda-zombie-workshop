// Processes incoming messages for Zombie chat service
var aws = require('aws-sdk');
var ddb;
var querystring = require('querystring');

var http = require('request');

var theContext;
var message;
var from;
var numMedia;
var mediaURL;
var timestamp;
var channel = 'default';


exports.handler = function(event, context) {
    init(context);
    theContext = context;

    if(event.message == null || event.message == 'null' || event.name == null || event.name == 'null') {
        return context.fail("Message and Name cannot be null");
    } else {
        message = event.message;
        from = event.name;
    }

    if (event.timestamp == null || event.timestamp == 'null') {
        event.timestamp = "" + new Date().getTime();
        timestamp = event.timestamp;
    }

    /**
     * For Debubugging input params to the lambda function
    console.log('Message: ' + message);
    console.log('Sender: ' + from);
    console.log('Channel: ' + channel);
    */

    var DDBparams = {
        "Item": {
            "channel":{"S":channel},
            "message":{"S":message},
            "timestamp":{"N":timestamp},
            "name":{"S":from}
        }
    };

    dynamoPut(DDBparams);
    http.post(
        'https://hooks.slack.com/services/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',
        { json: { text: message } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
            }
        }
    );
};

function init(context) {
  if(!ddb) {
    console.log("Initializing DynamoDB client.");
    var stackName = context.functionName.split('-z0mb1es-')[0];
    var stackRegion = context.functionName.split('-WriteMessagesToDynamoDB-')[1];
    ddb = new aws.DynamoDB({
      region: stackRegion,
      params: { TableName: stackName + "-messages" }
    });
  }
}

function dynamoPut(params){
    console.log("Putting item into DynamoDB");
    ddb.putItem(params, dynamoCallback);
}

function dynamoCallback(err, response) {
  if (err) {
      console.log('error' + err, err.stack); // an error occurred
      return theContext.fail("There was an error.");
  } else {
      console.log('Success: ' + '{Sender: ' + from + ', ' + 'Message: ' + message + '}');
      return theContext.succeed();
  }
}
