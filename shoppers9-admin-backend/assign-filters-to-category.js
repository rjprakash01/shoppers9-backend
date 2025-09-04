const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5001';

async function getToken() {
  // Try admin_token.json first
  try {
    if (fs.existsSync('admin_token.json')) {
      const data = JSON.parse(fs.readFileSync('admin_token.json', 'utf8'));
      if (data && (data.token || data.accessToken)) {
        return data.token || data.accessToken;
      }
    }
  } catch {}

  // Try super_admin_login2.json
  try {
    if (fs.existsSync('super_admin_login2.json')) {
      const data = JSON.parse(fs.readFileSync('super_admin_login2.json', 'utf8'));
      if (data && (data.token || data.accessToken)) {
        return data.token || data.accessToken;
      }
    }
  } catch {}

  // Login as super admin
  console.log('Logging in as super admin...');
  const resp = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
    email: 'superadmin@shoppers9.com',
    password: 'superadmin123'
  });
  const token = resp.data?.data?.accessToken || resp.data?.accessToken || resp.data?.token;
  if (!token) throw new Error('Failed to acquire token');
  // Save for reuse
  try {
    fs.writeFileSync('admin_token.json', JSON.stringify({ token, user: resp.data?.data?.user || null }, null, 2));
  } catch {}
  return token;
}

async function fetchLevel3Categories() {
  const url = `${BASE_URL}/api/admin/categories/level/3`;
  const resp = await axios.get(url);
  // Support possible response shapes
  const data = resp.data?.data || resp.data?.categories || resp.data || [];
  return Array.isArray(data) ? data : (data.items || []);
}

function pickTargetCategory(categories) {
  const preferred = ['Cookware','T-Shirts','Shoes','Appliances','Utensils','Storage','Bedding','Furniture','Decor','Lighting'];
  const byName = (name) => categories.find(c => (c.name || c.displayName || '').toLowerCase() === name.toLowerCase());
  for (const n of preferred) {
    const hit = byName(n);
    if (hit) return hit;
  }
  return categories[0] || null;
}

async function getAvailableFilters(categoryId, token) {
  const url = `${BASE_URL}/api/admin/categories/${categoryId}/available-filters`;
  const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }});
  const payload = resp.data?.data || {};
  const list = payload.availableFilters || [];
  return Array.isArray(list) ? list : [];
}

function selectFilters(available) {
  const desired = ['kitchenware_type','capacity','material','price_range','color_finish','color','size','gender'];
  const byName = new Map(available.map(f => [ (f.name || '').toLowerCase(), f ]));
  const chosen = [];
  for (const d of desired) {
    const f = byName.get(d);
    if (f) chosen.push(f);
  }
  // Fallback: take first few if none matched
  if (chosen.length === 0) {
    return available.slice(0, 3);
  }
  return chosen.slice(0, 6);
}

async function bulkAssign(category, filters, token) {
  const body = {
    filters: filters.map((f, idx) => ({
      filterId: f._id || f.id,
      isRequired: false,
      sortOrder: idx + 1
    }))
  };
  const url = `${BASE_URL}/api/admin/categories/${category._id || category.id}/filters/bulk`;
  const resp = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }});
  return resp.data;
}

async function verify(categoryId, token) {
  const url = `${BASE_URL}/api/admin/categories/${categoryId}/filters`;
  const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }});
  return resp.data;
}

async function main() {
  try {
    const token = await getToken();
    const cats = await fetchLevel3Categories();
    console.log(`Found ${cats.length} level-3 categories`);
    if (!cats.length) throw new Error('No level-3 categories found');

    const target = pickTargetCategory(cats);
    if (!target) throw new Error('No target category could be selected');
    console.log(`Target category: ${(target.name || target.displayName)} (${target._id || target.id})`);

    const available = await getAvailableFilters(target._id || target.id, token);
    console.log(`Available filters for target: ${available.length}`);

    const selected = selectFilters(available);
    if (!selected.length) throw new Error('No filters available to assign');
    console.log('Assigning filters:', selected.map(f => f.name || f.displayName));

    const result = await bulkAssign(target, selected, token);
    console.log('Bulk assign result:', JSON.stringify(result, null, 2));

    const verification = await verify(target._id || target.id, token);
    console.log('\nVerification (category filters):');
    console.log(JSON.stringify(verification, null, 2));

  } catch (err) {
    console.error('Error:', err.response?.data || err.message || err);
  }
}

main();