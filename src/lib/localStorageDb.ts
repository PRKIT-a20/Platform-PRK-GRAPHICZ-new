// A simple LocalStorage based wrapper to replace backend queries
const getTable = (table: string) => {
  try {
    return JSON.parse(localStorage.getItem(`db_${table}`) || '[]');
  } catch {
    return [];
  }
};
const setTable = (table: string, data: any[]) => {
  localStorage.setItem(`db_${table}`, JSON.stringify(data));
};

export const localDb = {
  from: (table: string) => ({
    select: (cols?: string) => {
      let result = [...getTable(table)];
      const chain = {
        eq: (col: string, val: any) => {
          result = result.filter(r => r[col] === val);
          return chain;
        },
        order: (col: string, { ascending = true }: { ascending?: boolean } = {}) => {
          result.sort((a, b) => {
            if (a[col] < b[col]) return ascending ? -1 : 1;
            if (a[col] > b[col]) return ascending ? 1 : -1;
            return 0;
          });
          return chain;
        },
        single: () => {
          return Promise.resolve({ data: result[0] || null, error: null });
        },
        then: (resolve: any) => {
          resolve({ data: result, error: null });
        }
      };
      return chain;
    },
    insert: (item: any) => {
      const data = getTable(table);
      // Supabase insert takes array or object
      const items = Array.isArray(item) ? item : [item];
      const newItems = items.map(i => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...i }));
      data.push(...newItems);
      setTable(table, data);
      return Promise.resolve({ data: Array.isArray(item) ? newItems : newItems[0], error: null });
    },
    update: (item: any) => {
      const chain = {
        eq: (col: string, val: any) => {
          const data = getTable(table);
          let updated = null;
          for (let i = 0; i < data.length; i++) {
            if (data[i][col] === val) {
              data[i] = { ...data[i], ...item };
              updated = data[i];
            }
          }
          setTable(table, data);
          return Promise.resolve({ data: updated, error: null });
        }
      };
      return chain;
    },
    delete: () => {
      const chain = {
        eq: (col: string, val: any) => {
          const data = getTable(table);
          setTable(table, data.filter(d => d[col] !== val));
          return Promise.resolve({ error: null });
        }
      };
      return chain;
    }
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://fake-url.com/${bucket}/${path}` } }),
      createSignedUrl: async (path: string, num: number) => ({ data: { signedUrl: `https://fake-url.com/${bucket}/${path}` }, error: null }),
      remove: async (paths: string[]) => ({ data: null, error: null })
    })
  },
  channel: (name: string) => ({
    on: () => ({ subscribe: () => {} })
  }),
  removeChannel: () => {}
};
