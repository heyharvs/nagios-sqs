#!/usr/bin/env node
'use strict';

var AWS = require('aws-sdk');

// pull from commandline
var accessKeyId = process.argv[2];
var secretAccessKey = process.argv[3];
var region = process.argv[4];
var queue = process.argv[5];
var warning = process.argv[6];
var critical = process.argv[7];

// validate that we have credentials
if (!accessKeyId || !secretAccessKey || !region || !queue || !warning || !critical) {
  console.log(`Usage: nagios-sqs <accessKeyId> <secretAccessKey> <region> <queue> <warning> <critical>`);
  process.exit(1);
}

// configure instance
AWS.config.update({
  'accessKeyId': accessKeyId,
  'secretAccessKey': secretAccessKey,
  'region': region,
});

// use bluebird for all promises
AWS.config.setPromisesDependency(require('bluebird'));

// get instance
var sqs = new AWS.SQS();

sqs.getQueueAttributes({
  QueueUrl: queue,
  AttributeNames: [
    "ApproximateNumberOfMessages"
  ]
}).promise()
.then(results => {
  let count = results.Attributes.ApproximateNumberOfMessages;
  // critical error
  if (parseInt(count) > critical) {
    console.log(`ERROR - ${queue} in ${region} has ${count} in queue (${critical})`);
    process.exit(2);
    return;
  }

  if (parseInt(count) > warning) {
    console.log(`WARNING - ${queue} in ${region} has ${count} in queue (${warning})`);
    process.exit(1);
    return;
  }

  console.log(`OK - ${queue} in ${region} has ${count} in queue`);
  process.exit(0);
})
.catch(err => {
  console.log(`ERROR ${err}`);
  process.exit(3);
});
