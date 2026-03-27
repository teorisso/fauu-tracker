export const GUARANI_CODE_MAP: Record<string, string | string[]> = {
  // Plan 2018
  'ARQ-01.01': 'curso_ingreso',
  'ARQ-01.02': 'arquitectura_1',
  'ARQ-01.03': 'sistemas_representacion',
  'ARQ-01.04': 'ciencias_basicas',
  'ARQ-01.05': 'intro_tecnologia',
  'ARQ-01.06': 'intro_diseno',
  'ARQ-02.01': 'arquitectura_2',
  'ARQ-02.02': 'morfologia_1',
  'ARQ-02.03': 'construcciones_1',
  'ARQ-02.04': 'estructuras_1',
  'ARQ-02.05': 'instalaciones_1',
  'ARQ-02.06': 'historia_critica_1',
  'ARQ-02.07': 'teoria_diseno_1',
  'ARQ-03.01': 'arquitectura_3',
  'ARQ-03.02': 'morfologia_2',
  'ARQ-03.03': 'construcciones_2',
  'ARQ-03.04': 'estructuras_2',
  'ARQ-03.05': 'instalaciones_2',
  'ARQ-03.06': 'historia_critica_2',
  'ARQ-03.07': 'intro_urbanismo',
  'ARQ-04.01': 'arquitectura_4',
  'ARQ-04.02': 'construcciones_3',
  'ARQ-04.03': 'estructuras_3',
  'ARQ-04.04': 'instalaciones_3',
  'ARQ-04.05': 'urbanismo',
  'ARQ-04.06': 'historia_critica_3',
  'ARQ-04.07': 'teoria_diseno_2',
  'ARQ-05.01': 'arquitectura_5',
  'ARQ-05.02': 'organizacion_produccion_obras',
  'ARQ-05.03': 'planeamiento_territorial',
  'ARQ-05.04': 'gestion_habitat_social',
  'ARQ-06.01': 'tfc',
  'ARQ-06.02': 'ppa',
  'ARQ-06.03': 'org_legislacion_gestion',

  // Plan 2003/06 — equivalencias segun tabla oficial del Plan de Transicion
  'ARQ-A1':   'arquitectura_1',
  'ARQ-A2':   'arquitectura_2',
  'ARQ-A3':   'arquitectura_3',
  'ARQ-A4':   'arquitectura_4',
  'ARQ-CB':   'ciencias_basicas',
  'ARQ-IT':   'intro_tecnologia',
  'ARQ-SRE':  'sistemas_representacion',
  'ARQ-IE':   'estructuras_1',       // Intro a las Estructuras -> Estructuras I
  'ARQ-E1':   'estructuras_2',       // Estructuras I (03/06) -> Estructuras II (2018)
  'ARQ-E2':   'estructuras_3',       // Estructuras II (03/06) -> Estructuras III (2018)
  'ARQ-INST1': 'instalaciones_1',
  'ARQ-INST2': ['instalaciones_2', 'instalaciones_3'],
  'ARQ-C1':   'construcciones_1',
  'ARQ-C2':   ['construcciones_2', 'construcciones_3'],
  'ARQ-HC1':  'historia_critica_1',
  'ARQ-HC2':  'historia_critica_2',
  'ARQ-HC3':  'historia_critica_3',
  'ARQ-MOR1': 'morfologia_1',
  'ARQ-MOR2': 'morfologia_2',
  'ARQ-TD1':  'teoria_diseno_1',
  'ARQ-TD2':  'teoria_diseno_2',
  'ARQ-TDGU': 'intro_urbanismo',     // Teoria del Diseño y la Gestion Urbana -> Intro al Urbanismo
  'ARQ-DU1':  'planeamiento_territorial', // Desarrollo Urbano I -> Planeamiento y Ord. Territorial
  'ARQ-DU2':  'urbanismo',           // Desarrollo Urbano II -> Urbanismo
  'ARQ-GDVP': 'gestion_habitat_social',  // Gestion y Desarrollo de la Vivienda Popular -> Gestion y Prod. Habitat Social
  'ARQ-OPP':  ['organizacion_produccion_obras', 'org_legislacion_gestion'],
  'ARQ-SPAT': 'ppa',                 // Seminario PPA en Tecnologia -> PPA
}
