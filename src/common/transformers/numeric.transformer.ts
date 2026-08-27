import { ValueTransformer } from 'typeorm';

/**
 * Transforma columnas DECIMAL de MySQL (que el driver devuelve como string
 * para no perder precision) a `number` en la capa de aplicacion, de modo que
 * el JSON de la API tenga el MISMO shape que devolvia Supabase (numeros, no
 * strings). La precision se conserva en la base porque el tipo sigue siendo
 * DECIMAL; solo se convierte al serializar.
 *
 * Para montos donde la precision de float podria ser un problema al operar
 * (sumas de facturas grandes), hacer las operaciones aritmeticas en el
 * servicio con una libreria de decimales o en SQL, no en JS con floats.
 */
export class ColumnNumericTransformer implements ValueTransformer {
  to(value: number | null): number | null {
    return value;
  }

  from(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    return parseFloat(value);
  }
}
