const { supabase } = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const { NotFoundError, ConflictError } = require('../utils/errors');

const ALLOWED_COLUMNS = new Set([
  'drop_id',
  'name',
  'description',
  'price',
  'sizes',
  'colors',
  'image_urls',
  'status',
  'default_quality_level_id',
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

async function findByDropId(dropId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('drop_id', dropId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function findById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findBySlugConflict(slug, excludeId = null) {
  return false;
}

async function create(data) {
  const payload = sanitize(data);
  const { data: row, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

async function update(id, data) {
  const payload = sanitize(data);
  if (Object.keys(payload).length === 0) {
    const { data: row } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    return row;
  }

  const { data: row, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return row;
}

async function softDelete(id) {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'draft' })
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

async function deleteVariants(productId) {
  const { error } = await supabaseAdmin
    .from('product_variants')
    .delete()
    .eq('product_id', productId);

  if (error) throw error;
}

module.exports = {
  findByDropId,
  findById,
  findBySlug,
  findBySlugConflict,
  create,
  update,
  softDelete,
  deleteVariants,
};
