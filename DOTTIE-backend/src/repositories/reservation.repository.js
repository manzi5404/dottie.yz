const { supabaseAdmin } = require('../config/supabaseAdmin');

async function createReservation(data) {
  const { data: row, error } = await supabaseAdmin
    .from('reservations')
    .insert(data)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

module.exports = {
  createReservation,
};
