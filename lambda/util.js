//@ts-check
const AWS = require('aws-sdk');

const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4'
});

/**
 * Get the user id string from the current request. Used for persistent data storage per-user.
 * 
 * @param handlerInput 
 * @return {string}
 */
const getUserId = (handlerInput) => {
    try {
        return handlerInput.requestEnvelope.context.System.user.userId;
    } catch (error) {
        console.log('Error occurred while getting user id:', error);
        throw error;
    }
};

/**
 * Get Person
 * @param {*} handlerInput 
 */
const getPerson = (handlerInput) => {
    return handlerInput.requestEnvelope.context.System.person;
}

/**
 * Get Person Id
 * @param {*} handlerInput 
 */
const getPersonId = (handlerInput) => {
    const person = getPerson(handlerInput);
    if (person) {
        return person.personId;
    }
}


/**
 * get Day and period
 * @param {*} handlerInput 
 */
const getDayAndPeriod = async (handlerInput) => {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;

    let userTimeZone;
    try {
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    } catch (error) {
        if (error.name !== 'ServiceError') {
            return handlerInput.responseBuilder.speak("There was a problem connecting to the service.").getResponse();
        }
        console.log('error', error.message);
    }
    console.log("User's timezone: " + userTimeZone);
    let requestDate = new Date(handlerInput.requestEnvelope.request.timestamp);
    let hour = parseInt(requestDate.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: userTimeZone }));
    console.log("The current hour in the user's timezone: " + hour);
    let period;
    if (hour <= 14 && hour >= 2) {
        period = "lunch"
    } else {
        period = "dinner";
    }
    return {
        day: requestDate.toLocaleString('en-US', { timeZone: userTimeZone, weekday: 'long' }).toLowerCase(),
        period: period
    }
}

/**
 * Get Session Attributes
 * @param {*} handlerInput 
 */
const getSessionAttributes = (handlerInput) => {
    return handlerInput.attributesManager.getSessionAttributes();
}

/**
 * get Welcome Greetings
 * @param {*} handlerInput
 */
const getGreetings = async (handlerInput) => {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;

    let userTimeZone;
    try {
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
    } catch (error) {
        userTimeZone = "Asia/Kolkata";
        //timezone = 'Europe/Rome'; 
        console.log('error', error.message);
    }
    if(typeof userTimeZone === "undefined")
        userTimeZone = "Asia/Kolkata";
    console.log("User's timezone: " + userTimeZone);
    let requestDate = new Date(handlerInput.requestEnvelope.request.timestamp);
    let hour = parseInt(requestDate.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: userTimeZone }));
    console.log("The current hour in the user's timezone: " + hour);
    let greetings;
    if (hour < 12 && hour >= 3) {
        greetings = handlerInput.t('MORNING_MSG');
    } else if (hour <= 15 && hour >= 12) {
        greetings = handlerInput.t('AFTERNOON_MSG');
    }
    else {
        greetings = handlerInput.t('EVENING_MSG');
    }
    console.log("Your greeting", greetings)
    return greetings;
}

module.exports = {
    getS3PreSignedUrl(s3ObjectKey) {

        const bucketName = process.env.S3_PERSISTENCE_BUCKET;
        const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: s3ObjectKey,
            Expires: 60 * 1 // the Expires is capped for 1 minute
        });
        console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
        return s3PreSignedUrl;
    },
    getPersistenceAdapter(tableName) {
        // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
        function isAlexaHosted() {
            return process.env.S3_PERSISTENCE_BUCKET;
        }
        if (isAlexaHosted()) {
            const { S3PersistenceAdapter } = require('ask-sdk-s3-persistence-adapter');
            return new S3PersistenceAdapter({
                bucketName: process.env.S3_PERSISTENCE_BUCKET
            });
        } else {
            // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
            const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
            return new DynamoDbPersistenceAdapter({
                tableName: tableName || 'happy_birthday',
                createTable: true
            });
        }
    },

    /**
     * Get Slots Value
     * @param {*} handlerInput 
     */
    getSlotValues(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        if(typeof filledSlots === "undefined")
            return {};
        const slotValues = {};

        Object.keys(filledSlots).forEach((item) => {
            const name = filledSlots[item].name;
            slotValues[name] = {};

            // Extract the nested key 'code' from the ER resolutions in the request
            let erStatusCode;
            try {
                erStatusCode = ((((filledSlots[item] || {}).resolutions ||
                    {}).resolutionsPerAuthority[0] || {}).status || {}).code;
            } catch (e) {
                // console.log('erStatusCode e:' + e)
            }

            switch (erStatusCode) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name].synonym = filledSlots[item].value;
                    slotValues[name].resolved = filledSlots[item].resolutions
                        .resolutionsPerAuthority[0].values[0].value.name;
                    slotValues[name].id = filledSlots[item].resolutions
                        .resolutionsPerAuthority[0].values[0].value.id;
                    slotValues[name].isValidated = filledSlots[item].value ===
                        filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name;
                    slotValues[name].statusCode = erStatusCode;
                    break;

                default: // ER_SUCCESS_NO_MATCH, undefined
                    slotValues[name].synonym = filledSlots[item].value;
                    slotValues[name].resolved = filledSlots[item].value;
                    slotValues[name].id = filledSlots[item].value;
                    slotValues[name].isValidated = false;
                    slotValues[name].statusCode = erStatusCode === undefined ? 'undefined' : erStatusCode;
                    break;
            }
        }, this);

        return slotValues;
    },
    getUserId,
    getPerson,
    getPersonId,
    getDayAndPeriod,
    getSessionAttributes,
    getGreetings
}
