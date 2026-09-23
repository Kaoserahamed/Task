import { request, api, ApiError, getToken } from '../api/client';

const jsonResponse = (body, status = 200) =>
  Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  });

describe('api/client', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test('attaches the admin bearer token and returns the parsed payload', async () => {
    localStorage.setItem('admin-token', 'admin-jwt');
    fetch.mockReturnValue(jsonResponse({ success: true, tours: [] }));

    const data = await api.get('/api/tours');

    expect(data).toEqual({ success: true, tours: [] });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/tours');
    expect(options.headers.Authorization).toBe('Bearer admin-jwt');
    expect(getToken()).toBe('admin-jwt');
  });

  test('serialises JSON bodies and leaves FormData untouched', async () => {
    fetch.mockReturnValue(jsonResponse({ ok: true }));

    await api.post('/api/admin/profile', { name: 'Ada' });

    const [, jsonOptions] = fetch.mock.calls[0];
    expect(jsonOptions.headers['Content-Type']).toBe('application/json');
    expect(jsonOptions.body).toBe(JSON.stringify({ name: 'Ada' }));

    const form = new FormData();
    form.append('image', 'blob');
    fetch.mockReturnValue(jsonResponse({ ok: true }));

    await api.post('/api/admin/profile', form);

    const [, formOptions] = fetch.mock.calls[1];
    expect(formOptions.headers['Content-Type']).toBeUndefined();
    expect(formOptions.body).toBe(form);
  });

  test('turns non-2xx responses into ApiError with status, code and field errors', async () => {
    fetch.mockReturnValue(
      jsonResponse(
        { message: 'Invalid credentials', code: 'VALIDATION_ERROR', errors: [{ field: 'email' }] },
        401
      )
    );

    const error = await api.post('/api/admin/login', { email: 'a@b.c' }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: 'Invalid credentials',
      status: 401,
      code: 'VALIDATION_ERROR',
      errors: [{ field: 'email' }],
    });
    expect(request).toBeDefined();
    expect(typeof request).toBe('function');
  });

  test('reports transport failures without a status', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.get('/api/tours')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  test('auth:false omits the token even when one is stored', async () => {
    localStorage.setItem('admin-token', 'admin-jwt');
    fetch.mockReturnValue(jsonResponse({ success: true }));

    await api.post('/api/admin/login', { email: 'a@b.c' }, { auth: false });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test('returns null for 204 and empty bodies', async () => {
    fetch.mockReturnValue(jsonResponse(null, 204));
    await expect(api.put('/api/admin/profile', { name: 'Ada' })).resolves.toBeNull();

    fetch.mockReturnValue(
      Promise.resolve({ status: 200, ok: true, text: () => Promise.resolve(''), json: () => null })
    );
    await expect(api.delete('/api/tours/42', {})).resolves.toBeNull();
  });

  test('exposes the PATCH verb used by tour actions', async () => {
    fetch.mockReturnValue(jsonResponse({ success: true }));

    await api.patch('/api/tours/42/status', { status: 'approved' });

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('PATCH');
    expect(options.body).toBe(JSON.stringify({ status: 'approved' }));
  });

  test('reads plain-text, error-field and generic failure messages', async () => {
    fetch.mockReturnValue(
      Promise.resolve({ status: 500, ok: false, text: () => Promise.resolve('Boom') })
    );
    const plain = await api.get('/x').catch((err) => err);
    expect(plain.message).toBe('Boom');
    expect(plain.status).toBe(500);

    fetch.mockReturnValue(jsonResponse({ error: 'Invalid credentials' }, 401));
    const flagged = await api.get('/y').catch((err) => err);
    expect(flagged.message).toBe('Invalid credentials');

    fetch.mockReturnValue(
      Promise.resolve({ status: 503, ok: false, text: () => Promise.resolve('') })
    );
    const generic = await api.get('/z').catch((err) => err);
    expect(generic.message).toBe('Request failed with status 503');
  });
});
