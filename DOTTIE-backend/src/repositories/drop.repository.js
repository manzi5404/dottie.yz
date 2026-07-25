const { supabaseAdmin } = require('../config/supabaseAdmin');
const { NotFoundError } = require('../utils/errors');

const ALLOWED_COLUMNS = new Set([
  'title',
  'description',
  'image_url',
  'release_date',
  'status',
  'type',
]);

function sanitize(data = {}) {
  const out = {};
  for (const key of Object.keys(data)) {
    if (ALLOWED_COLUMNS.has(key)) {
      out[key] = data[key];
    }
  }
  return out;
}

async function findActive() {
   const nowIso = new Date().toISOString();
   const { data, error } = await supabaseAdmin
    .from('drops')
    .select('*')
    .eq('status', 'live')
    .lte('release_date', nowIso)
    .or('close_date.is.null,close_date.gt.' + nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findAll(includeAll = false) {
  let query = supabaseAdmin.from('drops').select('*').order('created_at', { ascending: false });

  if (!includeAll) {
    query = query.in('status', ['live', 'upcoming']);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function findById(id) {
  const { data, error } = await supabaseAdmin
    .from('drops')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findBySlug(slug) {
  return null;
}

async function findSlugConflict(slug, excludeId = null) {
  return false;
}

async function demotePreviousNewDrops(excludeId) {
    const { data, error } = await supabaseAdmin
        .from('drops')
        .update({ type: 'recent-drop' })
        .neq('id', excludeId)
        .eq('type', 'new-drop')
        .select('id');

    if (error) throw error;
    return data || [];
}

async function create(data) {
    const payload = sanitize(data);
    const { data: row, error } = await supabaseAdmin
        .from('drops')
        .insert(payload)
        .select('*')
        .single();

    if (error) throw error;
    return row;
}

async function update(id, data) {
    const payload = sanitize(data);
    if (Object.keys(payload).length === 0) {
      const { data: row } = await supabaseAdmin.from('drops').select('*').eq('id', id).maybeSingle();
      return row;
    }

    const { data: row, error } = await supabaseAdmin
        .from('drops')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return row;
}

async function activate(id) {
    const nowIso = new Date().toISOString();
    const payload = sanitize({ status: 'live', release_date: nowIso });
    const { data, error } = await supabaseAdmin
        .from('drops')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

async function remove(id) {
    const { error } = await supabaseAdmin
        .from('drops')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

module.exports = {
  findActive,
  findAll,
  findById,
  findBySlug,
  findSlugConflict,
  create,
  update,
  activate,
  demotePreviousNewDrops,
  remove,
};
