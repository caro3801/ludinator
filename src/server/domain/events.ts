export interface ModuleResetInitiated {
  type: 'ModuleResetInitiated'
  module: 'crew' | 'fest' | 'mioum'
  initiatedAt: string
  initiatedBy: 'admin'
}

// Ré-export depuis les autres fichiers events existants
export * from '../../crew/domain/events'
export * from '../../fest/domain/events'
export * from '../../mioum/domain/events'
