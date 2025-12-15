import { supabase } from '../supabase'

export const configService = {
  // Obtener la configuración actual
  async getConfig() {
    // Obtenemos la primera fila (solo debería haber una)
    const { data, error } = await supabase
      .from('configuracion_negocio')
      .select('*')
      .limit(1)
      .single()

    if (error) throw error
    return data
  },

  // Actualizar la configuración
  async updateConfig(id, nuevosDatos) {
    const { data, error } = await supabase
      .from('configuracion_negocio')
      .update(nuevosDatos)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
