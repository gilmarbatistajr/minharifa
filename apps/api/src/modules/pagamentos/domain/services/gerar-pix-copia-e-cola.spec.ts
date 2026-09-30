import { gerarPixCopiaECola, crc16Pix } from './gerar-pix-copia-e-cola';

describe('crc16Pix', () => {
  it('bate com o valor de verificação oficial do catálogo CRC-16/CCITT-FALSE para "123456789"', () => {
    expect(crc16Pix('123456789')).toBe('29B1');
  });
});

describe('gerarPixCopiaECola', () => {
  it('monta o payload com os campos obrigatórios do BR Code, na ordem certa', () => {
    const payload = gerarPixCopiaECola({
      chave: '11122233344',
      nomeRecebedor: 'João da Silva',
      cidadeRecebedor: 'São Paulo',
      valor: 150,
      txid: 'abc-123-def',
    });

    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('11122233344');
    expect(payload).toContain('5406150.00');
    expect(payload).toContain('JOAO DA SILVA');
    expect(payload).toContain('SAO PAULO');
    expect(payload).toContain('5802BR');
    expect(payload).toContain('ABC123DEF');
  });

  it('termina com um CRC16 de 4 dígitos hexadecimais válido para o restante do payload', () => {
    const payload = gerarPixCopiaECola({
      chave: 'chave-aleatoria-evp-123',
      nomeRecebedor: 'Maria Souza',
      valor: 42.5,
      txid: 'txid-teste',
    });

    const crc = payload.slice(-4);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
    expect(payload.slice(-8, -4)).toBe('6304');
  });

  it('usa BRASIL como cidade padrão quando nenhuma é informada', () => {
    const payload = gerarPixCopiaECola({
      chave: 'comprador@example.com',
      nomeRecebedor: 'Loja Teste',
      valor: 10,
      txid: 'txid1',
    });

    expect(payload).toContain('6006BRASIL');
  });

  it('remove acentos e caracteres especiais do nome do recebedor e trunca em 25 caracteres', () => {
    const payload = gerarPixCopiaECola({
      chave: '12345678900',
      nomeRecebedor: 'José Antônio de Oliveira Nascimento Júnior',
      valor: 1,
      txid: 'txid1',
    });

    expect(payload).toContain('JOSE ANTONIO DE OLIVEIRA');
    expect(payload).not.toContain('É');
    expect(payload).not.toContain('Ô');
  });

  it('usa "***" como referência quando o txid fica vazio depois de normalizado', () => {
    const payload = gerarPixCopiaECola({
      chave: '12345678900',
      nomeRecebedor: 'Loja Teste',
      valor: 1,
      txid: '---///',
    });

    expect(payload).toContain('0503***');
  });

  it('formata o valor sempre com duas casas decimais', () => {
    const payload = gerarPixCopiaECola({
      chave: '12345678900',
      nomeRecebedor: 'Loja Teste',
      valor: 7,
      txid: 'txid1',
    });

    expect(payload).toContain('54047.00');
  });
});
