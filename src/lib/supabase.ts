// Mock Supabase Client using localStorage
class MockSupabaseAuth {
  async getSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        return { data: { session: { user: data.user } }, error: null };
      }
      return { data: { session: null }, error: null };
    } catch (e) {
      return { data: { session: null }, error: e };
    }
  }
  
  onAuthStateChange(callback: any) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data.error } };
      return { data: { user: data.user }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  async signInWithOAuth({ provider }: any) {
    return { data: null, error: { message: 'OAuth is not supported in this version' } };
  }
  
  async signUp({ email, password, options }: any) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: options?.data?.full_name })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data.error } };
      return { data: { user: data.user }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }
  
  async signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  }
}

class MockQueryBuilder {
  table: string;
  query: any = {};
  
  constructor(table: string) {
    this.table = table;
  }
  
  select(columns: string) {
    this.query.type = 'select';
    return this;
  }
  
  insert(data: any) {
    this.query.type = 'insert';
    this.query.data = Array.isArray(data) ? data : [data];
    return this;
  }
  
  update(data: any) {
    this.query.type = 'update';
    this.query.data = data;
    return this;
  }
  
  delete() {
    this.query.type = 'delete';
    return this;
  }
  
  eq(col: string, val: any) {
    this.query.filters = this.query.filters || [];
    this.query.filters.push({ col, val, op: 'eq' });
    return this;
  }
  
  order(col: string, opts: any) {
    this.query.order = { col, ascending: opts?.ascending ?? true };
    return this;
  }
  
  single() {
    this.query.single = true;
    return this;
  }
  
  async then(resolve: any, reject: any) {
    try {
      const res = await fetch(`/api/rest/${this.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.query)
      });
      const result = await res.json();
      if (!res.ok) {
        return resolve({ data: null, error: { message: result.error } });
      }
      return resolve({ data: result.data, error: null });
    } catch (e) {
      return resolve({ data: null, error: e });
    }
  }
}

export const supabase = {
  auth: new MockSupabaseAuth(),
  from: (table: string) => new MockQueryBuilder(table),
  channel: (name: string) => ({
    on: () => ({ subscribe: () => {} })
  }),
  removeChannel: () => {},
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://fake-url.com/${bucket}/${path}` } }),
      createSignedUrl: async (path: string, num: number) => ({ data: { signedUrl: `https://fake-url.com/${bucket}/${path}` }, error: null }),
      remove: async (paths: string[]) => ({ data: null, error: null })
    })
  }
};
