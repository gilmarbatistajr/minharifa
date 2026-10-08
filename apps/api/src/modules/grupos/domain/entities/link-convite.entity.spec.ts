import { LinkConvite } from './link-convite.entity';

describe('LinkConvite', () => {
  describe('estaValido', () => {
    it('retorna true para link ativo', () => {
      const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'ATIVO', new Date());

      expect(link.estaValido()).toBe(true);
    });

    it('retorna false para link revogado', () => {
      const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'REVOGADO', new Date());

      expect(link.estaValido()).toBe(false);
    });
  });

  describe('revogar', () => {
    it('revoga um link ativo', () => {
      const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'ATIVO', new Date());

      link.revogar();

      expect(link.status).toBe('REVOGADO');
    });

    it('impede revogar um link já revogado', () => {
      const link = new LinkConvite('link-1', 'grupo-1', 'ABC123', 'REVOGADO', new Date());

      expect(() => link.revogar()).toThrow('já está revogado');
    });
  });
});
