// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
//@ts-check
const Alexa = require('ask-sdk-core');
const util = require('./util');
const states = require('./states')
const helper = require('./quiz-helper')

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const greetings = await util.getGreetings(handlerInput);
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        const name = sessionAttributes.name;
        const { in_progress,totalQuestions } = sessionAttributes;
        let speakOutput, reprompt;

        if (in_progress && totalQuestions) {
            // Old users
            const { questionsAnswered, questionCategory } = sessionAttributes;
            const helpTxt = handlerInput.t('HELP_OLD_USER_MSG')
            if (typeof name !== "undefined") {
                speakOutput = handlerInput.t('WELCOME_BACK_PERSONALIZED_MSG', {
                    greetings: greetings,
                    name: name,
                    prompt: handlerInput.t('CURRENT_STATUS', {
                        total_answered: questionsAnswered,
                        total_questions: totalQuestions,
                        category: helper.getCategoryTitleFromId(questionCategory)
                    }),
                    helpMessage: helpTxt
                })
            } else {
                speakOutput = handlerInput.t('WELCOME_BACK_MSG', {
                    greetings: greetings,
                    prompt: handlerInput.t('CURRENT_STATUS', {
                        total_answered: questionsAnswered,
                        total_questions: totalQuestions,
                        category: helper.getCategoryTitleFromId(questionCategory)
                    }),
                    helpMessage: helpTxt
                })
            }
            reprompt = handlerInput.t('REPROMPT_MSG', {
                prompt: helpTxt
            })
            sessionAttributes.state = states.QUIZ_STARTED;
        } else {
            // First time or quiz completed users
            const helpTxt = handlerInput.t('HELP_NEW_USER_MSG')
            if (typeof name !== "undefined") {
                // If we could retrive Person ID
                speakOutput = handlerInput.t('WELCOME_PERSONALIZED', {
                    greetings: greetings,
                    name: name,
                    prompt: helpTxt
                });
            } else {
                // Test Simulator and permission issue tackler
                speakOutput = handlerInput.t('WELCOME_MSG', {
                    greetings: greetings,
                    prompt: helpTxt
                });
            }
            reprompt = handlerInput.t('REPROMPT_MSG', {
                prompt: helpTxt
            })
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};

const StartQuizIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartQuizIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        let preface = "";
        if (!helper.hasQuizStarted(sessionAttributes)) {
            const slots = helper.getApiParams(handlerInput, sessionAttributes);
            const categoryTxt = helper.getCategoryTitleFromId(slots.apiCategory);
            preface += `OK. Lets test your knowledge on ${categoryTxt}. I will ask you ${slots.apiAmount} questions about the ${categoryTxt}.  `;
        }
        preface += "Here we go! "
        const response = await helper.nextQuestion(handlerInput, preface);
        return response;
    }
};

const AnswerQuizIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerQuizIntent';
    },
    async handle(handlerInput) {
        const slotValues = util.getSlotValues(handlerInput);

        if (slotValues.hasOwnProperty('answer') && slotValues.
            answer.resolved) {
            const response = await helper.checkAnswer(handlerInput, slotValues.
                answer.resolved);
            return response;
        }
        return handlerInput.responseBuilder
            .speak(`<say-as interpret-as="interjection">hmm</say-as>. Having trouble ? Try answering, option, then your answer, for example, option one .`)
            .reprompt(handlerInput.t('REPROMPT_MSG', { prompt: " Try answering, option, then your answer, for example, option one ." }))
            .getResponse();
    }
};

const RestartQuizIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RestartQuizIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        if(helper.hasQuizStarted(sessionAttributes))
            helper.quizEndedChangeStatus(sessionAttributes);
        const response = await helper.nextQuestion(handlerInput, "<say-as interpret-as='interjection'>Alright!</say-as><break strength='strong'/> Lets get it started !,  ");
        return response;
    }
};


const GetCategoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetCategoryIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        const helpTxt = helper.hasQuizStarted(sessionAttributes) ? handlerInput.t('HELP_OLD_USER_MSG') : handlerInput.t('HELP_NEW_USER_MSG');
        const speakOutput = helper.getAllCategoriesTxt()+ ` ${helpTxt}`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(handlerInput.t('REPROMPT_MSG',{prompt:speakOutput}))
            .getResponse();
    }
};


const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        const response = await RestartQuizIntentHandler.handle(handlerInput);
        return response;
    }
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        return CancelAndStopIntentHandler.handle(handlerInput);
    }
};

const RepeatIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        let speakOutput = handlerInput.t('HELP_NEW_USER_MSG');
        if(helper.hasQuizStarted(sessionAttributes)){
          speakOutput =  sessionAttributes.lastQuestionText || handlerInput.t('HELP_OLD_USER_MSG');
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = util.getSessionAttributes(handlerInput);
        const speakOutput = helper.hasQuizStarted(sessionAttributes) ? handlerInput.t('HELP_OLD_USER_MSG') : handlerInput.t('HELP_NEW_USER_MSG');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = `Thank you for playing the Psy's Quiz Game!  Let's play again soon! <audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_outro_01"/>`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = `Sorry, I don't know about that. Please try again. You can always ask for help by saying help.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

module.exports = {
    LaunchRequestHandler,
    StartQuizIntentHandler,
    AnswerQuizIntentHandler,
    RestartQuizIntentHandler,
    RepeatIntentHandler,
    GetCategoryIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    IntentReflectorHandler,
    SessionEndedRequestHandler,
    ErrorHandler
}