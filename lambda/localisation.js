//@ts-check
module.exports = {
    en: {
        translation: {
            MORNING_MSG: `Good Morning !`,
            AFTERNOON_MSG: `Good Afternoon !`,
            EVENING_MSG: ` Good Evening !`,
            WELCOME_MSG: `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_intro_01"/>{{greetings}} , Welcome to psy's Quiz Game !. I am Quiz master Psy. I can ask questions on Computers, films, books, sports and many more, you can learn more about available categories, by saying, categories. {{prompt}} . In order to provide more personalised greeting messages, psy's quiz game will need access to your given name. Go to the home screen in your Alexa app and grant me permissions. `,
            WELCOME_PERSONALIZED: `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_intro_01"/> {{greetings}} , Welcome to psy's Quiz Game! ,{{name}} . I am Quiz master Psy.  {{prompt}}`,
            CURRENT_STATUS: `You've answered {{total_answered}} of {{total_questions}} questions on {{category}}.`,
            WELCOME_BACK_MSG: `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_bridge_02"/>{{greetings}} , Welcome back to psy's Quiz Game!.  Last time {{prompt}} {{helpMessage}}. In order to provide more personalised greeting messages, psy's quiz game skill will need access to your given name. Go to the home screen in your Alexa app and grant me permissions. `,
            WELCOME_BACK_PERSONALIZED_MSG: `<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_bridge_02"/>{{greetings}} , Welcome back to psy's Quiz Game! ,{{name}}. Last time {{prompt}} {{helpMessage}}`,
            REPROMPT_MSG: `Sorry, I didn't catch that. {{prompt}}`,
            HELP_NEW_USER_MSG: `You can start the quiz by saying ten questions on any category.`,
            HELP_OLD_USER_MSG: `You can resume the quiz by saying questions or you could restart the quiz by saying, Restart Quiz with ten questions on any category, or just restart quiz. You can also take quiz with any number of questions between one and fifteen. Which would you like to try?`,


        },
    }
}