const API_BASE_URL = window.API_BASE_URL || document.body?.dataset?.apiBaseUrl || (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000';
  return 'https://DOTTIE-backend-production.up.railway.app';
})();

const collectionsLogic = () => ({
  collections: [],
  loading: true,

  async init() {
    this.loading = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/collections?includeDrops=true`);
      const data = await res.json();
      if (data.success) {
        this.collections = data.collections.map(c => ({
          ...c,
          coverImage: c.image_url || this.firstDropImage(c.drops),
          drops: (c.drops || []).map(d => this.normalizeDrop(d)),
        }));
      }
    } catch (e) {
      console.error('Failed to load collections', e);
    } finally {
      this.loading = false;
    }
  },

  normalizeDrop(d) {
    return {
      ...d,
      image: d.image_url || '/placeholder.jpg',
    };
  },

  firstDropImage(drops) {
    if (!drops || !drops.length) return '/placeholder.jpg';
    return drops[0].image_url || '/placeholder.jpg';
  },

  resolveImage(drop) {
    if (!drop) return '/placeholder.jpg';
    return drop.image_url || '/placeholder.jpg';
  },
});

export default collectionsLogic;
