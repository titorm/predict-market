import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseApiResponse } from '../api-client.ts';

describe('API Client Response Parsing', () => {
  it('deve processar resposta JSON valida com sucesso', async () => {
    const mockResponse = new Response(
      JSON.stringify({ success: true, user: { id: 'u-1', email: 'user@teste.com' } }),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = await parseApiResponse<{ success: boolean; user: { id: string; email: string } }>(
      mockResponse
    );

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.data.success, true);
    assert.equal(result.data.user.email, 'user@teste.com');
  });

  it('deve extrair campos de erro estruturado quando status for 400 ou 500', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        error: 'Este e-mail ja esta cadastrado',
        code: '23505',
        diagnosis: 'Registro duplicado',
      }),
      {
        status: 409,
        statusText: 'Conflict',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = await parseApiResponse(mockResponse);

    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
    assert.equal(result.data.error, 'Este e-mail ja esta cadastrado');
    assert.equal(result.data.code, '23505');
    assert.equal(result.data.diagnosis, 'Registro duplicado');
  });

  it('deve tratar resposta HTML ou texto puro sem quebrar a execucao', async () => {
    const htmlPayload = '<html><body>502 Bad Gateway</body></html>';
    const mockResponse = new Response(htmlPayload, {
      status: 502,
      statusText: 'Bad Gateway',
      headers: { 'Content-Type': 'text/html' },
    });

    const result = await parseApiResponse(mockResponse);

    assert.equal(result.ok, false);
    assert.equal(result.status, 502);
    assert.equal(result.data.error, htmlPayload);
  });

  it('deve lidar com corpo de resposta vazio', async () => {
    const mockResponse = new Response(null, {
      status: 204,
      statusText: 'No Content',
    });

    const result = await parseApiResponse(mockResponse);

    assert.equal(result.ok, true);
    assert.equal(result.status, 204);
    assert.deepEqual(result.data, {});
  });
});
