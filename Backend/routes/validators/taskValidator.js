const { checkSchema } = require('express-validator');

const taskValidators = {}

taskValidators.validateCreate = () => {
    return checkSchema({
        title: { notEmpty: true, isLength: { options: { max: 50 } } },
        description: { optional: true, notEmpty: false, isLength: { options: { min: 1, max: 2000 } } },
        important_fixed: { optional: true, isBoolean: true },
        state: { optional: true, isIn: { options: [[1, 2, 3, 4, 5]] } }, //Revisar
        context_id: {optional: true, isInt: { min: 0 }},
        project_id: {optional: true, isInt: { min: 0 } },
        date_limit: {optional: true, isISO8601: true},
        //TODO Verification list
    })
}


taskValidators.validateModify = () => {
    return checkSchema({
        title: { optional: true, notEmpty: true, isLength: { options: { max: 50 } } },
        description: { optional: true, notEmpty: false, isLength: { options: { min: 1, max: 2000 } } },
        important_fixed: { optional: true, isBoolean: true },
        state: { optional: true, isIn: { options: [[1, 2, 3, 4, 5]] } }, //Revisar
        context_id: {optional: {options: {values: 'null'}}, isInt: { min: 0 }},
        project_id: {optional: {options: {values: 'null'}}, isInt: { min: 0 }},
        date_limit: {optional: true, isISO8601: true},
        completed: {optional: true, isBoolean: true},
        //TODO Verification list
    })
}


taskValidators.validateMoveList = () => {
    return checkSchema({
        list_ids: {notEmpty: true, isArray: true},
        state: { notEmpty: true, isIn: { options: [[1, 2, 3, 4, 5]] } }, //Revisar
    })
}

taskValidators.validateCompleteList = () => {
    return checkSchema({
        list_ids: {notEmpty: true, isArray: true},
        completed: {notEmpty: true, isBoolean: true},
    })
}

module.exports = taskValidators;