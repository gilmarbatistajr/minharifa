import { Grupo } from './grupo.entity';

describe('Grupo', () => {
  describe('pertenceAoAdministrador', () => {
    it('retorna true quando o administrador é o dono do grupo', () => {
      const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

      expect(grupo.pertenceAoAdministrador('admin-1')).toBe(true);
    });

    it('retorna false quando o administrador não é o dono do grupo', () => {
      const grupo = new Grupo('grupo-1', 'admin-1', 'Amigos do bem', '5511999999999', new Date());

      expect(grupo.pertenceAoAdministrador('admin-2')).toBe(false);
    });
  });
});
