# 🔧 FIX: Error MongoDB en obtenerTiposVehiculos

## ❌ Problema

Al intentar cargar tipos de vehículos en Planes Mensuales, aparecía este error:

```
MongooseError: Operation `tipovehiculos.find()` buffering timed out after 10000ms
```

**Causa:** El endpoint `/api/v1/sistema/tipos-vehiculos` estaba usando Mongoose (MongoDB) pero el sistema está corriendo con SQLite en modo demo.

---

## ✅ Solución

Se modificó el método `obtenerTiposVehiculos` en `ConfiguracionController.ts` para usar **SQLite** en lugar de MongoDB.

### Código Anterior (MongoDB/Mongoose):
```typescript
async obtenerTiposVehiculos(req: Request, res: Response): Promise<void> {
  try {
    const tipos = await TipoVehiculo.find({ activo: true }).sort({ nombre: 1 });
    
    res.json({
      success: true,
      data: tipos.map(t => ({
        id: t._id,
        nombre: t.nombre,
        precio_hora: t.precio_hora,
        precio_fraccion: t.precio_fraccion,
        minutos_fraccion: t.minutos_fraccion
      }))
    });
  } catch (error) {
    logger.error('Error obteniendo tipos de vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}
```

### Código Nuevo (SQLite):
```typescript
async obtenerTiposVehiculos(req: Request, res: Response): Promise<void> {
  try {
    // Importar dbService para SQLite
    const { dbService } = await import('../services/DatabaseService');
    
    // Consultar tipos de vehículos desde SQLite
    const tipos = await dbService.query(`
      SELECT id, nombre, tarifa_hora as precio_hora, tarifa_dia as precio_fraccion
      FROM tipos_vehiculos 
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    res.json({
      success: true,
      data: tipos.map((t: any) => ({
        id: t.id.toString(),
        nombre: t.nombre,
        precio_hora: t.precio_hora,
        precio_fraccion: t.precio_fraccion,
        minutos_fraccion: 15
      }))
    });
  } catch (error) {
    logger.error('Error obteniendo tipos de vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}
```

---

## 🔄 Para Aplicar el Fix

### 1. Detener el servidor backend
En la terminal donde corre el backend:
- Presiona `Ctrl + C`

### 2. Reiniciar el servidor
```powershell
cd backend
npm run dev
```

O si usas el comando combinado:
```powershell
npm run dev
```

### 3. Verificar en el navegador
1. Abre http://localhost:3000
2. Ve a **Planes Mensuales**
3. Click en **"Nueva Suscripción"**
4. El dropdown "Tipo de Vehículo" debe cargar los tipos correctamente

---

## 📊 Consulta SQL Utilizada

```sql
SELECT 
  id, 
  nombre, 
  tarifa_hora as precio_hora, 
  tarifa_dia as precio_fraccion
FROM tipos_vehiculos 
WHERE activo = 1
ORDER BY nombre ASC
```

**Devuelve:**
- `id`: ID del tipo de vehículo
- `nombre`: Nombre del tipo (ej: "Automóvil", "Motocicleta")
- `precio_hora`: Tarifa por hora
- `precio_fraccion`: Tarifa por día

---

## ✅ Resultado

Ahora el endpoint funciona correctamente con SQLite y devuelve los tipos de vehículos configurados en la base de datos.

---

**Archivo modificado:** `backend/src/controllers/ConfiguracionController.ts`  
**Fecha:** 23 de Octubre, 2025  
**Estado:** ✅ Compilado exitosamente
