//@ts-check
const axios = require('axios');
const util = require('./util')
const states = require('./states')
const constants = require('./constants')

// Options
const alphabetIndex = ['A', 'B', 'C', 'D'];

// This is a list of positive speechcons that this skill will use when a user gets
// a correct answer.  For a full list of supported speechcons, go here:
// https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsCorrect = ['Booya', 'All righty', 'Bam', 'Bazinga', 'Bingo', 'Boom', 'Bravo', 'Cha Ching', 'Cheers', 'Dynomite',
    'Hip hip hooray', 'Hurrah', 'Hurray', 'Huzzah', 'Oh dear.  Just kidding.  Hurray', 'Kaboom', 'Kaching', 'Oh snap', 'Phew',
    'Righto', 'Way to go', 'Well done', 'Whee', 'Woo hoo', 'Yay', 'Wowza', 'Yowsa'];


// This is a list of negative speechcons that this skill will use when a user gets
// an incorrect answer.  For a full list of supported speechcons, go here:
// https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsWrong = ['Argh', 'Aw man', 'Blarg', 'Blast', 'Boo', 'Bummer', 'Darn', 'D\'oh', 'Dun dun dun', 'Eek', 'Honk', 'Le sigh',
    'Mamma mia', 'Oh boy', 'Oh dear', 'Oof', 'Ouch', 'Ruh roh', 'Shucks', 'Uh oh', 'Wah wah', 'Whoops a daisy', 'Yikes'];

function getRandomPhrase(array) {
    // the argument is an array [] of words or phrases
    const i = Math.floor(Math.random() * array.length);
    return (array[i]);
}

function getSpeechCon(type) {
    if (type) {
        return `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01"/><say-as interpret-as='interjection'>${getRandomPhrase(speechConsCorrect)}! </say-as><break strength='strong'/>`;
    }
    return `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01"/><say-as interpret-as='interjection'>${getRandomPhrase(speechConsWrong)} </say-as><break strength='strong'/>`;
}

/**
 * Call Quiz Api
 * @param {*} amount 
 * @param {*} category 
 */
async function callApi(amount, category) {
    const endpoint = `https://opentdb.com/api.php`;
    const config = {
        timeout: 6500, // timeout api call before we reach Alexa's 8 sec timeout, or set globally via axios.defaults.timeout
        headers: { 'Accept': 'application/json' }
    };
    let categoryTxt = "";
    if(category !== "any"){
        categoryTxt = `&category=${category}`;
    }
    const url = endpoint + `?amount=${amount}&type=multiple${categoryTxt}`;
    //@ts-expect-error
    const questions = await axios.get(url, config)
        .then(function (response) {
            const data = response.data;
            console.log('Successfull: API response for fetch questions', response.data);
            return data;
        }).catch((error) => {
            console.log("FAILED: API response for fetch question");
            console.log(error)
            return {};
        });
    return questions;
}

/**
 * Get Random number
 * @param {*} min 
 * @param {*} max 
 */
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * 
 * @param {*} str 
 */
function htmlDecode(str) {
    return str.replace(/&#(\d+);/g, function (match, dec) {
        return String.fromCharCode(dec);
    });
}


/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * get questions formatted
 * @param {*} params 
 */
async function getQuestions({ apiAmount, apiCategory }) {
    //Our API response
    var response = await callApi(apiAmount, apiCategory);
    //if API was Successfull
    if (response.hasOwnProperty('results')) {
        const { results } = response;
        const questions = results.map((row, index) => {
            let { question, incorrect_answers, correct_answer } = row;
            let luckyNum = randomNumber(0, 3);
            row.questionNo = (index + 1);
            row.question = sanitize(question);
            row.correct_answer = sanitize(correct_answer)
            row.correctAnswerIndex = luckyNum;
            incorrect_answers.splice(luckyNum, 0, sanitize(correct_answer));
            const options = incorrect_answers.map(sanitize);
            row.options = options;
            row.answered = false;
            return row;
        })
        return questions;
    }
    // API failed
    return [];
}

function sanitize(string){
    return escapeRegExp(htmlDecode(replaceQuotes(string)));
}

/**
 * Has Quiz Started ?
 * @param {*} sessionAttributes
 */
function hasQuizStarted(sessionAttributes) {
    return sessionAttributes.state === states.QUIZ_STARTED;
}

/**
 * Get Api Params formatted 
 * @param {*} handlerInput
 */
function getApiParams(handlerInput, sessionAttributes) {
   
    let slotValues = util.getSlotValues(handlerInput);
    let apiCategory = constants.DEFAULT_QUESTION_CATEGORY;
    let apiAmount = constants.DEFAULT_QUESTION_NO;
    // Total questions
    if (slotValues.hasOwnProperty('questionsNo') && typeof slotValues.questionsNo.resolved !== "undefined" && slotValues.questionsNo.resolved) {
        // Quiz not yet started or has ended
        apiAmount = slotValues.questionsNo.resolved;
    } else if (sessionAttributes.hasOwnProperty('totalQuestions')) {
        // restarting with the same 
        apiAmount = sessionAttributes.totalQuestions;
    }
    sessionAttributes.totalQuestions = apiAmount;
    
    // Question Category
    if (slotValues.hasOwnProperty('category') && typeof slotValues.category.id !== "undefined") {
        // Quiz not yet started or has ended
        apiCategory = slotValues.category.id;
    } else if (sessionAttributes.hasOwnProperty('questionCategory')) {
        // resumed with the same 
        apiCategory = sessionAttributes.questionCategory;
    }
    sessionAttributes.questionCategory = apiCategory;

    return {
        apiAmount,
        apiCategory
    };
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^$&{}()|[\]\\]/g, ''); // $& means the whole matched string
}

function replaceQuotes(string) {
  return string.replace(/&quot;/g, '\\"'); // $& means the whole matched string
}
/**
 * Get Current Question
 * @param {*} handlerInput 
 */
async function getCurrentQuestion(handlerInput) {
    const sessionAttributes = util.getSessionAttributes(handlerInput);
    let speechText;
    if (hasQuizStarted(sessionAttributes)) {
        // Quiz already started, so play along 
        const { questions, currentQuestionIndex } = sessionAttributes;
        if(questions.length === 0){
            // worst case scenario
            quizEndedChangeStatus(sessionAttributes)
            const response = await getCurrentQuestion(handlerInput)
            return response;
        }
        speechText = `  Question ${currentQuestionIndex + 1} of ${questions.length}. `;
        sessionAttributes.lastQuestionText = getQuestionTextFormatted(questions[currentQuestionIndex]);
        speechText += sessionAttributes.lastQuestionText;
    } else {
        // Quiz not yet started
        let params = getApiParams(handlerInput, sessionAttributes);
        const questions = await getQuestions(params);
        let currentQuestionIndex = 0;
        sessionAttributes.currentQuestionIndex = currentQuestionIndex;
        sessionAttributes.questions = questions;
        sessionAttributes.questionsAnswered = 0;
        sessionAttributes.correctAnswered = 0;
        sessionAttributes.in_progress = true;
        sessionAttributes.state = states.QUIZ_STARTED;
        speechText = `  Question ${currentQuestionIndex + 1} of ${questions.length}. `;
        sessionAttributes.lastQuestionText = getQuestionTextFormatted(questions[currentQuestionIndex]);
        speechText += sessionAttributes.lastQuestionText;
    }
    return speechText;
}

/**
 * get Options Formatted
 * @param {*} index 
 * @param {*} text 
 */
function getOptionFormated(index, text) {
    return ` Option <say-as interpret-as="cardinal">${index}</say-as>, ${text}, `
}

/**
 * get Question Formatted
 * @param {*} questionDetails 
 */
function getQuestionTextFormatted(questionDetails) {
    let { question, options } = questionDetails;
    let optionText = "";
    options.forEach((option, index) => {
        optionText += getOptionFormated((index + 1), option);
    });
    return `${escapeRegExp(question)} ? ${optionText}. `
}

/**
 * get next question
 * @param {*} handlerInput 
 * @param {*} preface 
 */
async function nextQuestion(handlerInput, preface) {
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = util.getSessionAttributes(handlerInput);
    // get a question
    const question = await getCurrentQuestion(handlerInput);
    const lastQuestionText = sessionAttributes.lastQuestionText;

    // ask the question
    return responseBuilder
        .speak(preface + question)
        .reprompt(`Here's your question again ${lastQuestionText}`)
        .getResponse();
}

/**
 * Category title
 * @param {*} categoryId 
 */
function getCategoryTitleFromId(categoryId) {
    const categories = require('./categories.json')
    const category = categories.find(category => category.key === categoryId);
    return category.value;
}


/**
 * Get all categories
 * 
 */
function getAllCategoriesTxt() {
    const categories = require('./categories.json')
    let categoriesTxt = `I can ask you questions from ${categories.length - 1} different categories. Starting from `; 
    categories.forEach( category => {
        if(category.key !== "any")
            categoriesTxt += ` ${category.value},`
    });
    categoriesTxt += ". I can also shuffle the categories by saying any category.";
    return categoriesTxt;
}

/**
 * Check My Answer
 * @param {*} handlerInput 
 * @param {*} givenAnswer 
 */
async function checkAnswer(handlerInput, givenAnswer) {
    const sessionAttributes = util.getSessionAttributes(handlerInput);
    const { questions, currentQuestionIndex } = sessionAttributes;
    const currentQuestion = questions[currentQuestionIndex];
    if (typeof currentQuestionIndex !== "undefined" && typeof currentQuestion !== "undefined") {
        const isLastQuestion = (currentQuestionIndex + 1) === questions.length;
        const isAnswerCorrect = (currentQuestion.correctAnswerIndex + 1) === parseInt(givenAnswer);
        const correctAnswerTxt = getOptionFormated((currentQuestion.correctAnswerIndex + 1), currentQuestion.correct_answer);
        let speechText = isAnswerCorrect ? `${getSpeechCon(true)} <amazon:emotion name="excited" intensity="medium"> you got it</amazon:emotion>, ${correctAnswerTxt} was right. ` : `${getSpeechCon(false)}, the answer was ${correctAnswerTxt}. `;
        if (isAnswerCorrect)
            ++sessionAttributes.correctAnswered;
        sessionAttributes.questions[sessionAttributes.currentQuestionIndex].answered = true;    
        // incase if its the last question
        if (isLastQuestion) {
            const { responseBuilder } = handlerInput;
            const { correctAnswered } = sessionAttributes;
            let quizEndedMessage = `, And that was the last question. You've answered ${correctAnswered} out of ${questions.length} questions correctly.  Would you like to retake the quiz with ${questions.length} question on same category ?`;
            quizEndedChangeStatus(sessionAttributes);
            speechText += quizEndedMessage;
            return responseBuilder.speak(speechText)
                .reprompt(quizEndedMessage)
                .getResponse();
        }

        // Increment all counters
        incrementCounter(sessionAttributes);
        
        // final touch up string
        speechText += isAnswerCorrect ? " here's another, " : " let's try again, ";
        // lets ask user another question 
        const response = await nextQuestion(handlerInput, speechText);
        return response;
    }
    // incase if user cheated and said options first, worst case scenario
    const response = await nextQuestion(handlerInput, "Here's a new question.")
    return response;
}

function quizEndedChangeStatus(sessionAttributes){
    sessionAttributes.currentQuestionIndex = 0;
    sessionAttributes.questions = [];
    sessionAttributes.questionsAnswered = 0;
    sessionAttributes.correctAnswered = 0;
    sessionAttributes.state = states.QUIZ_ENDED;
    sessionAttributes.in_progress = false;
    sessionAttributes.lastQuestionText = "";
}

/**
 * 
 * @param {*} sessionAttributes
 */
function incrementCounter(sessionAttributes) {
    ++sessionAttributes.questionsAnswered;
    ++sessionAttributes.currentQuestionIndex;
}

module.exports = {
    nextQuestion,
    getApiParams,
    hasQuizStarted,
    getCategoryTitleFromId,
    quizEndedChangeStatus,
    getAllCategoriesTxt,
    checkAnswer
}