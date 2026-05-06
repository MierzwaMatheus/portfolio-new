import { vi } from "vitest";

type AnyDoc = Record<string, any> & { _id: string; _creationTime: number };

type IndexFn = (q: { eq: (field: string, value: any) => any; lt: (field: string, value: any) => any; gt: (field: string, value: any) => any }) => any;

interface IndexCondition {
  type: "eq" | "lt" | "gt";
  field: string;
  value: any;
}

class QueryBuilder {
  private filters: Array<(doc: AnyDoc) => boolean> = [];
  private indexConditions: IndexCondition[] = [];
  private orderDir: "asc" | "desc" = "asc";

  constructor(private docs: AnyDoc[]) {}

  withIndex(_indexName: string, fn?: IndexFn): this {
    if (!fn) return this;
    const captured: IndexCondition[] = [];
    const proxy = {
      eq: (field: string, value: any) => {
        captured.push({ type: "eq", field, value });
        return proxy;
      },
      lt: (field: string, value: any) => {
        captured.push({ type: "lt", field, value });
        return proxy;
      },
      gt: (field: string, value: any) => {
        captured.push({ type: "gt", field, value });
        return proxy;
      },
    };
    fn(proxy);
    this.indexConditions = captured;
    return this;
  }

  filter(fnOrFilter: any): this {
    if (typeof fnOrFilter === "function") {
      const captured = fnOrFilter({
        eq: (a: any, b: any) => ({ type: "eq", a, b }),
        neq: (a: any, b: any) => ({ type: "neq", a, b }),
        gt: (a: any, b: any) => ({ type: "gt", a, b }),
        gte: (a: any, b: any) => ({ type: "gte", a, b }),
        lt: (a: any, b: any) => ({ type: "lt", a, b }),
        lte: (a: any, b: any) => ({ type: "lte", a, b }),
        and: (...args: any[]) => ({ type: "and", args }),
        or: (...args: any[]) => ({ type: "or", args }),
        not: (a: any) => ({ type: "not", a }),
        field: (name: string) => ({ type: "field", name }),
      });
      this.filters.push((doc) => evalExpr(captured, doc));
    }
    return this;
  }

  order(dir: "asc" | "desc"): this {
    this.orderDir = dir;
    return this;
  }

  private apply(): AnyDoc[] {
    let results = this.docs.filter((doc) => {
      for (const cond of this.indexConditions) {
        const docValue = doc[cond.field];
        if (cond.type === "eq" && docValue !== cond.value) return false;
        if (cond.type === "lt" && !(docValue < cond.value)) return false;
        if (cond.type === "gt" && !(docValue > cond.value)) return false;
      }
      for (const f of this.filters) {
        if (!f(doc)) return false;
      }
      return true;
    });
    results = [...results].sort((a, b) =>
      this.orderDir === "asc"
        ? a._creationTime - b._creationTime
        : b._creationTime - a._creationTime,
    );
    return results;
  }

  async unique(): Promise<AnyDoc | null> {
    const r = this.apply();
    if (r.length > 1)
      throw new Error("unique() returned more than one document");
    return r[0] ? cloneDoc(r[0]) : null;
  }

  async first(): Promise<AnyDoc | null> {
    const r = this.apply()[0];
    return r ? cloneDoc(r) : null;
  }

  async collect(): Promise<AnyDoc[]> {
    return this.apply().map(cloneDoc);
  }

  async take(n: number): Promise<AnyDoc[]> {
    return this.apply().slice(0, n).map(cloneDoc);
  }

  async paginate(_opts: any): Promise<{ page: AnyDoc[]; isDone: boolean; continueCursor: string }> {
    return { page: this.apply().map(cloneDoc), isDone: true, continueCursor: "" };
  }

  withSearchIndex(_indexName: string, _fn?: any): this {
    return this;
  }
}

function evalExpr(expr: any, doc: AnyDoc): boolean {
  if (!expr) return true;
  const a = () => resolveValue(expr.a, doc);
  const b = () => resolveValue(expr.b, doc);
  if (expr.type === "eq") return a() === b();
  if (expr.type === "neq") return a() !== b();
  if (expr.type === "gt") return a() > b();
  if (expr.type === "gte") return a() >= b();
  if (expr.type === "lt") return a() < b();
  if (expr.type === "lte") return a() <= b();
  if (expr.type === "not") return !evalExpr(expr.a, doc);
  if (expr.type === "and") return expr.args.every((a: any) => evalExpr(a, doc));
  if (expr.type === "or") return expr.args.some((a: any) => evalExpr(a, doc));
  return true;
}

function resolveValue(v: any, doc: AnyDoc): any {
  if (v && typeof v === "object" && v.type === "field") return doc[v.name];
  return v;
}

function cloneDoc<T extends AnyDoc>(doc: T): T {
  return structuredClone(doc);
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `mock_${idCounter}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface MockDb {
  query(table: string): QueryBuilder;
  insert(table: string, doc: any): Promise<string>;
  patch(id: string, partial: any): Promise<void>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<AnyDoc | null>;
  // Test-only helpers
  _seed(table: string, docs: any[]): string[];
  _all(table: string): AnyDoc[];
  _reset(): void;
}

export function createMockDb(): MockDb {
  const tables = new Map<string, AnyDoc[]>();

  const findById = (id: string): { table: string; doc: AnyDoc; index: number } | null => {
    for (const [table, docs] of tables.entries()) {
      const i = docs.findIndex((d) => d._id === id);
      if (i >= 0) return { table, doc: docs[i], index: i };
    }
    return null;
  };

  return {
    query(table: string) {
      return new QueryBuilder(tables.get(table) ?? []);
    },
    async insert(table: string, doc: any) {
      const id = makeId();
      const list = tables.get(table) ?? [];
      const inserted: AnyDoc = {
        _id: id,
        _creationTime: Date.now(),
        ...doc,
      };
      list.push(inserted);
      tables.set(table, list);
      return id;
    },
    async patch(id: string, partial: any) {
      const found = findById(id);
      if (!found) throw new Error(`Document ${id} not found`);
      Object.assign(found.doc, partial);
    },
    async delete(id: string) {
      const found = findById(id);
      if (!found) return;
      const list = tables.get(found.table)!;
      list.splice(found.index, 1);
    },
    async get(id: string) {
      const found = findById(id);
      return found ? cloneDoc(found.doc) : null;
    },
    _seed(table: string, docs: any[]) {
      const ids: string[] = [];
      const list = tables.get(table) ?? [];
      for (const doc of docs) {
        const id = doc._id ?? makeId();
        const inserted: AnyDoc = {
          _id: id,
          _creationTime: doc._creationTime ?? Date.now(),
          ...doc,
        };
        list.push(inserted);
        ids.push(id);
      }
      tables.set(table, list);
      return ids;
    },
    _all(table: string) {
      return [...(tables.get(table) ?? [])];
    },
    _reset() {
      tables.clear();
    },
  };
}

export interface MockCtx {
  db: MockDb;
  auth: {
    getUserIdentity: ReturnType<typeof vi.fn>;
  };
  runQuery: ReturnType<typeof vi.fn>;
  runMutation: ReturnType<typeof vi.fn>;
  runAction: ReturnType<typeof vi.fn>;
  scheduler: {
    runAfter: ReturnType<typeof vi.fn>;
    runAt: ReturnType<typeof vi.fn>;
  };
  storage: {
    getUrl: ReturnType<typeof vi.fn>;
    generateUploadUrl: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
}

export interface CreateCtxOptions {
  identity?: { subject: string; tokenIdentifier?: string } | null;
}

export function createMockCtx(opts: CreateCtxOptions = {}): MockCtx {
  return {
    db: createMockDb(),
    auth: {
      getUserIdentity: vi
        .fn()
        .mockResolvedValue(opts.identity === undefined ? null : opts.identity),
    },
    runQuery: vi.fn(),
    runMutation: vi.fn(),
    runAction: vi.fn(),
    scheduler: {
      runAfter: vi.fn().mockResolvedValue(undefined),
      runAt: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      getUrl: vi.fn(async (id: string) => `https://example.com/${id}`),
      generateUploadUrl: vi.fn(async () => "https://upload.example.com/abc"),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
  };
}
