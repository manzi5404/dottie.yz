const express = require('express');
const { verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);

// GET /api/orders/my - Get current user's orders
router.get('/my', orderController.getMyOrders);

// GET /api/orders - Admin: get all orders
router.get('/', verifyAdmin, orderController.getAllOrders);

// PUT /api/orders/:id/status - Admin: update order status
router.put('/:id/status', verifyAdmin, orderController.updateStatus);

module.exports = router;
