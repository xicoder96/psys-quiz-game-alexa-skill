//@ts-check
module.exports = {
    // default total questions count
    DEFAULT_QUESTION_NO: 10,
    // default question Category
    DEFAULT_QUESTION_CATEGORY: "any",
    // we now specify which attributes are saved (see the save interceptor below)
    DONOT_PERSISTENT_ATTRIBUTES_NAMES: ['lastQuestionText'],
    // these are the permissions needed to fetch the first name
    GIVEN_NAME_PERMISSION: ['alexa::profile:given_name:read'],
    // these are the permissions needed to send reminders
    REMINDERS_PERMISSION: ['alexa::alerts:reminders:skill:readwrite'],
    // max number of entries to fetch from the external API
}