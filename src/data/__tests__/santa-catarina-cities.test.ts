import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SANTA_CATARINA_CITIES,
  isSantaCatarinaCity,
  normalizeCityName,
  findCanonicalSantaCatarinaCity,
  filterSantaCatarinaCities,
} from '../santa-catarina-cities.ts';

describe('Santa Catarina Cities Dataset and Utilities', () => {
  it('deve conter exatamente 295 municipios oficiais de Santa Catarina', () => {
    assert.equal(SANTA_CATARINA_CITIES.length, 295);
    const uniqueCities = new Set(SANTA_CATARINA_CITIES);
    assert.equal(uniqueCities.size, 295);
  });

  it('deve incluir municipios principais e recentes de SC', () => {
    assert.equal(isSantaCatarinaCity('Florianópolis'), true);
    assert.equal(isSantaCatarinaCity('Joinville'), true);
    assert.equal(isSantaCatarinaCity('Blumenau'), true);
    assert.equal(isSantaCatarinaCity('Chapecó'), true);
    assert.equal(isSantaCatarinaCity('Criciúma'), true);
    assert.equal(isSantaCatarinaCity('Lages'), true);
    assert.equal(isSantaCatarinaCity('Balneário Camboriú'), true);
    assert.equal(isSantaCatarinaCity('Balneário Rincão'), true);
    assert.equal(isSantaCatarinaCity('Pescaria Brava'), true);
  });

  it('deve rejeitar cidades que nao pertencem a Santa Catarina', () => {
    assert.equal(isSantaCatarinaCity('Curitiba'), false);
    assert.equal(isSantaCatarinaCity('Porto Alegre'), false);
    assert.equal(isSantaCatarinaCity('São Paulo'), false);
    assert.equal(isSantaCatarinaCity('Rio de Janeiro'), false);
    assert.equal(isSantaCatarinaCity(''), false);
    assert.equal(isSantaCatarinaCity('   '), false);
  });

  it('deve normalizar strings removendo acentos e espacos', () => {
    assert.equal(normalizeCityName('Florianópolis'), 'florianopolis');
    assert.equal(normalizeCityName('Chapecó'), 'chapeco');
    assert.equal(normalizeCityName('  São José  '), 'sao jose');
  });

  it('deve encontrar o nome canonico acentuado a partir de buscas flexiveis', () => {
    assert.equal(findCanonicalSantaCatarinaCity('florianopolis'), 'Florianópolis');
    assert.equal(findCanonicalSantaCatarinaCity('chapeco'), 'Chapecó');
    assert.equal(findCanonicalSantaCatarinaCity('sao jose'), 'São José');
    assert.equal(findCanonicalSantaCatarinaCity('JOINVILLE'), 'Joinville');
    assert.equal(findCanonicalSantaCatarinaCity('criciuma'), 'Criciúma');
    assert.equal(findCanonicalSantaCatarinaCity('Curitiba'), undefined);
    assert.equal(findCanonicalSantaCatarinaCity(''), undefined);
  });

  it('deve filtrar municipios com prioridade para prefixo', () => {
    const resultsFlo = filterSantaCatarinaCities('Floria');
    assert.equal(resultsFlo[0], 'Florianópolis');

    const resultsPrefix = filterSantaCatarinaCities('Flor');
    assert.equal(resultsPrefix.includes('Flor do Sertão'), true);
    assert.equal(resultsPrefix.includes('Florianópolis'), true);

    const resultsCha = filterSantaCatarinaCities('Chape');
    assert.equal(resultsCha[0], 'Chapecó');

    const resultsAll = filterSantaCatarinaCities('');
    assert.equal(resultsAll.length, 295);

    const resultsEmpty = filterSantaCatarinaCities('NaoExisteCidadeAssim');
    assert.equal(resultsEmpty.length, 0);
  });
});
