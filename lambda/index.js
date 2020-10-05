/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
//@ts-check
const Alexa = require('ask-sdk-core');
const handlers = require('./handlers')
const util = require('./util')
const interceptors = require('./interceptors')

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        handlers.LaunchRequestHandler,
        handlers.StartQuizIntentHandler,
        handlers.AnswerQuizIntentHandler,
        handlers.RestartQuizIntentHandler,
        handlers.GetCategoryIntentHandler,
        handlers.RepeatIntentHandler,
        handlers.YesIntentHandler,
        handlers.NoIntentHandler,
        handlers.HelpIntentHandler,
        handlers.CancelAndStopIntentHandler,
        handlers.FallbackIntentHandler,
        handlers.SessionEndedRequestHandler,
        handlers.IntentReflectorHandler)
    .addErrorHandlers(
        handlers.ErrorHandler)
    .addRequestInterceptors(
        interceptors.LoggingRequestInterceptor,
        interceptors.LoadAttributesRequestInterceptor,
        interceptors.LocalisationRequestInterceptor,
        interceptors.LoadTimezoneRequestInterceptor,
        interceptors.LoadNameRequestInterceptor,
    )
    .addResponseInterceptors(
        interceptors.LoggingResponseInterceptor,
        interceptors.SaveAttributesResponseInterceptor
    )
    .withPersistenceAdapter(util.getPersistenceAdapter('quiz_game_v2'))
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('quiz-game/v2')
    .lambda();