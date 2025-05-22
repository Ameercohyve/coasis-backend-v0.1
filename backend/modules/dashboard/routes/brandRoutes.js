const express = require('express');
const { createBrand, getBrand } = require('../controllers/brandController');

const router = express.Router();

router.post('/create-brand', createBrand);
router.get('/:brandId', getBrand);

module.exports = router;