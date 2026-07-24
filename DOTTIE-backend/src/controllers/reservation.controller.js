const reservationRepo = require('../repositories/reservation.repository');
const { handleServiceError } = require('../utils/responseHandler');

async function createReservation(req, res) {
  try {
    const {
      productId,
      fullName,
      email,
      phone,
      size,
      color,
      quantity,
      quality_level_id,
      storeMode,
    } = req.body || {};

    if (!productId || !fullName || !email) {
      return res.status(400).json({ success: false, message: 'productId, fullName, and email are required' });
    }

    const reservation = await reservationRepo.createReservation({
      product_id: productId,
      full_name: fullName,
      email,
      phone: phone || null,
      size: size || null,
      color: color || null,
      quantity: quantity || 1,
      quality_level_id: quality_level_id || null,
      store_mode: storeMode || 'live',
      status: 'pending',
    });

    return res.status(201).json({ success: true, reservation });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

module.exports = {
  createReservation,
};
