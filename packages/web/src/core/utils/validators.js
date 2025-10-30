"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxLength = exports.minLength = exports.isValidDate = exports.isEmpty = exports.isSSN = exports.isZipCode = exports.isPhone = exports.isEmail = void 0;
const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isEmail = isEmail;
const isPhone = (phone) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
};
exports.isPhone = isPhone;
const isZipCode = (zip) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
};
exports.isZipCode = isZipCode;
const isSSN = (ssn) => {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
};
exports.isSSN = isSSN;
const isEmpty = (value) => {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim() === '';
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
};
exports.isEmpty = isEmpty;
const isValidDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d instanceof Date && !isNaN(d.getTime());
};
exports.isValidDate = isValidDate;
const minLength = (value, min) => {
    return value.length >= min;
};
exports.minLength = minLength;
const maxLength = (value, max) => {
    return value.length <= max;
};
exports.maxLength = maxLength;
//# sourceMappingURL=validators.js.map