const { supabaseAdmin } = require('../config/supabaseAdmin');

async function getStoreConfig() {
  const { data, error } = await supabaseAdmin
    .from('store_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from('store_config')
      .insert({ id: 1, store_mode: 'closed', announcement: '' })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return normalize(newRow);
  }

  return normalize(data);
}

function normalize(row) {
  const mode = String(row.store_mode || 'closed').toLowerCase();
  const valid = ['live', 'reserve', 'closed', 'reservation'];
  const store_mode = valid.includes(mode) ? mode : 'closed';
  const reservation_enabled = store_mode === 'reserve' || store_mode === 'reservation';

  return {
    id: row.id,
    store_mode,
    announcement: row.announcement || '',
    reservation_enabled,
  };
}

module.exports = {
  getStoreConfig,
};
