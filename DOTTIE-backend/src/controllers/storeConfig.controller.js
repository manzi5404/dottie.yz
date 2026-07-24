const storeConfigRepo = require('../repositories/storeConfig.repository');

async function getStoreConfig(req, res) {
  try {
    const config = await storeConfigRepo.getStoreConfig();
    return res.status(200).json({ success: true, config });
  } catch (err) {
    console.error('[STORE_CONFIG] getStoreConfig failed:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch store config' });
  }
}

module.exports = {
  getStoreConfig,
};
