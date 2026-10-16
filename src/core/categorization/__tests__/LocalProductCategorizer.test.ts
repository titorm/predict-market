import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyProductCategory,
  classifyProductCategorySemantic,
  cleanFiscalProductName,
} from '../LocalProductCategorizer.ts';

describe('LocalProductCategorizer Semantic & Disambiguation Engine', () => {
  it('deve classificar maionese hellmans sabao como Mercearia e nao Limpeza', () => {
    const result = classifyProductCategorySemantic('maionese hellmans sabao');
    assert.equal(result.category, 'Mercearia');
    assert.ok(result.confidence >= 0.8);

    const fiscalVariant = classifyProductCategorySemantic(
      'Maionese Hellmanns Sabao Bg 335g Verde'
    );
    assert.equal(fiscalVariant.category, 'Mercearia');
    assert.equal(fiscalVariant.normalizedName, 'Maionese Hellmanns Sabor Bg 335g Verde');
  });

  it('deve classificar papel manteiga como Mercearia e nao Laticinios', () => {
    assert.equal(classifyProductCategory('papel manteiga'), 'Mercearia');
    assert.equal(
      classifyProductCategory('Papel Manteiga Bompack 28x4m'),
      'Mercearia'
    );
    assert.equal(
      classifyProductCategory('PAPEL MANTEIGA BOMPACK 28X4M'),
      'Mercearia'
    );
  });

  it('deve manter manteiga real em Laticinios e sabao real em Limpeza', () => {
    assert.equal(
      classifyProductCategory('Manteiga Com Sal Lac Lelo Pote 200g'),
      'Laticínios'
    );
    assert.equal(
      classifyProductCategory('Manteiga Batavo Extra 200g Sem Sal'),
      'Laticínios'
    );
    assert.equal(
      classifyProductCategory('Sabao Em Po Omo Lavagem Perfeita 1.6kg'),
      'Limpeza'
    );
    assert.equal(
      classifyProductCategory('Detergente Liquido Ype 500ml Neutro'),
      'Limpeza'
    );
  });

  it('deve desambiguar agua sanitaria (Limpeza) de agua mineral (Bebidas) e leite de coco (Mercearia)', () => {
    assert.equal(classifyProductCategory('Agua Sanitaria Ype 1L'), 'Limpeza');
    assert.equal(
      classifyProductCategory('Agua Mineral Valle Azul 500ml'),
      'Bebidas'
    );
    assert.equal(classifyProductCategory('Leite de Coco Sococo 200ml'), 'Mercearia');
    assert.equal(classifyProductCategory('Papel Higienico Neve c/ 12'), 'Higiene');
  });

  it('deve higienizar SAB e SABAO incorretos em nomes de alimentos', () => {
    assert.equal(
      cleanFiscalProductName('Maionese Hellmanns Sabao Bg 335g Verde'),
      'Maionese Hellmanns Sabor Bg 335g Verde'
    );
  });
});
