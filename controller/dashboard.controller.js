﻿const express = require('express');
const router = express.Router();
const userService = require('../service/dashboard.service');

// routes
router.post('/admin-sign-up', register);
router.post('/admin-authenticate', authenticate);
router.get('/search_by_email', search_by_email);
router.get('/bookings', bookings);
router.get('/driver_location', driverLocation);
router.get('/bookings_transaction', bookingsTransaction);

router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'email or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function bookings(req, res, next) {
    userService.bookings(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function driverLocation(req, res, next) {
    userService.driverLocation(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function bookingsTransaction(req, res, next) {
    userService.bookingsTransaction(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function search_by_email(req, res, next) {
    userService.search_by_email(req.body)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}