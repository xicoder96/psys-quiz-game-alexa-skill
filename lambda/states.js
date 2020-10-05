//@ts-check
module.exports = {
    QUIZ_STARTED: 'QUIZ_STARTED', // Quiz Questions Fetched using API
    QUESTION_ASKED: 'QUESTION_ASKED', // Question is asked user is yet to responded
    QUESTION_ANSWERED: 'QUESTION_ANSWERED', // Question is answered, user waiting for next question
    QUIZ_ENDED: 'QUIZ_ENDED', // User have answered all the questions. Need to refetch the questions using API
};
