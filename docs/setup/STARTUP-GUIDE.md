# 🚀 Scripts de Inicio Automático - POS Web Professional

Este documento explica cómo usar los scripts `.bat` para iniciar automáticamente el servidor POS cuando enciendes tu computadora.

---

## 📁 Archivos Incluidos

### 1️⃣ `start-server.bat`
**Función:** Inicia el servidor POS (Backend + Frontend) CON VENTANAS VISIBLES

**Qué hace:**
- ✅ Verifica e instala dependencias si es necesario
- ✅ Inicia el Backend en una ventana separada (Puerto 5000)
- ✅ Inicia el Frontend en una ventana separada (Puerto 3000)
- ✅ Mantiene ambos servidores ejecutándose con ventanas visibles
- ✅ Se cierra automáticamente después de iniciar

**Uso manual:**
```
Doble clic en start-server.bat
```

---

### 2️⃣ `start-server-hidden.vbs` ⭐ NUEVO
**Función:** Inicia el servidor POS SIN VENTANAS VISIBLES (en segundo plano)

**Qué hace:**
- ✅ Inicia Backend y Frontend completamente ocultos
- ✅ No muestra ninguna ventana en la pantalla
- ✅ Perfecto para inicio automático de Windows
- ✅ Los servidores corren en segundo plano

**Uso:**
```
Este archivo se ejecuta automáticamente con install-startup.bat
NO necesitas ejecutarlo manualmente
```

---

### 3️⃣ `install-startup.bat` ⭐ RECOMENDADO
**Función:** Instala el servidor en el inicio automático de Windows (MODO OCULTO)

**Qué hace:**
- ✅ Crea un acceso directo en la carpeta de Inicio de Windows
- ✅ Configura el servidor para iniciarse automáticamente al encender la PC
- ✅ Ejecuta el servidor SIN VENTANAS (completamente en segundo plano)
- ✅ No verás ninguna ventana al iniciar Windows

**Uso:**
```
1. Haz clic derecho en install-startup.bat
2. Selecciona "Ejecutar como administrador"
3. Espera el mensaje de confirmación
4. ¡Listo! El servidor se iniciará OCULTO automáticamente
```

---

### 4️⃣ `uninstall-startup.bat`
**Función:** Desinstala el inicio automático

**Qué hace:**
- ✅ Elimina el acceso directo del inicio automático
- ✅ El servidor ya NO se iniciará al encender la PC

**Uso:**
```
Doble clic en uninstall-startup.bat
```

---

### 5️⃣ `update-from-github.bat` 🔄 NUEVO
**Función:** Actualiza el proyecto desde GitHub con `git pull`

**Qué hace:**
- ✅ Guarda automáticamente tus cambios locales (stash)
- ✅ Descarga los últimos cambios desde GitHub
- ✅ Restaura tus cambios locales
- ✅ Actualiza las dependencias de npm automáticamente
- ✅ Muestra instrucciones para reiniciar el servidor

**Uso:**
```
Doble clic en update-from-github.bat
```

**IMPORTANTE:** Si los servidores están corriendo, debes reiniciarlos después de actualizar.

---

### 6️⃣ `stop-server.bat` 🛑 NUEVO
**Función:** Detiene todos los servidores Node.js ejecutándose

**Qué hace:**
- ✅ Busca todos los procesos de Node.js
- ✅ Muestra qué procesos se van a detener
- ✅ Detiene Backend y Frontend
- ✅ Útil cuando los servidores están ocultos

**Uso:**
```
Doble clic en stop-server.bat
```

---

## 🎯 Guía de Instalación Rápida

### Paso 1: Instalar en Inicio Automático (MODO OCULTO)
```
1. Haz clic derecho en: install-startup.bat
2. Selecciona: "Ejecutar como administrador"
3. Espera el mensaje: "INSTALACION EXITOSA!"
```

**✨ IMPORTANTE:** El servidor se iniciará **SIN VENTANAS VISIBLES** (en segundo plano).

### Paso 2: Probar (Opcional)
```
Opción A: Doble clic en start-server.bat (CON ventanas visibles)
Opción B: Doble clic en start-server-hidden.vbs (SIN ventanas, modo oculto)
```

### Paso 3: Reiniciar
```
Reinicia tu computadora para verificar que el servidor inicia automáticamente
NO VERÁS VENTANAS - El servidor estará corriendo en segundo plano
```

### Paso 4: Verificar que Funciona
```
1. Abre tu navegador
2. Ve a: http://localhost:3000
3. Deberías ver la interfaz del POS
```

---

## 🔧 Configuración del Sistema

### URLs de Acceso
- **Frontend (Interfaz):** http://localhost:3000
- **Backend (API):** http://localhost:5000

### Ventanas Abiertas

**MODO INICIO AUTOMÁTICO (start-server-hidden.vbs):**
- ✅ **NO verás NINGUNA ventana** - El servidor corre completamente oculto
- ✅ Para verificar que está corriendo: Abre http://localhost:3000
- ✅ Para detener: Usa `stop-server.bat`

**MODO MANUAL (start-server.bat):**
- Verás **2 ventanas**:
  - `POS Backend` - Servidor Node.js (Backend)
  - `POS Frontend` - Servidor Next.js (Frontend)
- **⚠️ NO CIERRES ESTAS VENTANAS** mientras uses el sistema POS

---

## ❓ Preguntas Frecuentes

### ¿Cómo sé si el servidor está funcionando?
1. Busca las ventanas: `POS Backend` y `POS Frontend`
2. Abre tu navegador en: http://localhost:3000
3. Deberías ver la interfaz del POS

### ¿Cómo detengo el servidor?
**Si está en MODO OCULTO (inicio automático):**
- Ejecuta `stop-server.bat` para detener todos los servidores

**Si está en MODO VISIBLE (manual):**
- **Opción 1:** Cierra las ventanas `POS Backend` y `POS Frontend`
- **Opción 2:** Presiona `Ctrl + C` en cada ventana
- **Opción 3:** Ejecuta `stop-server.bat`

### ¿Cómo actualizo el proyecto desde GitHub?
```
1. Ejecuta: update-from-github.bat
2. Espera a que termine la actualización
3. Si los servidores estaban corriendo, detenlos con stop-server.bat
4. Inicia de nuevo con start-server.bat (o reinicia la PC)
```

### ¿El servidor consume muchos recursos?
- **RAM:** ~300-500 MB (Backend + Frontend)
- **CPU:** ~2-5% en reposo, ~10-20% en uso activo

### ¿Qué pasa si cierro la ventana inicial?
No hay problema. La ventana inicial se cierra sola después de 5 segundos.
Los servidores siguen ejecutándose en sus propias ventanas.

### ¿Puedo mover el proyecto a otra carpeta?
Sí, pero debes:
1. Ejecutar `uninstall-startup.bat` en la ubicación actual
2. Mover la carpeta a la nueva ubicación
3. Ejecutar `install-startup.bat` en la nueva ubicación

### ¿Necesito internet para que funcione?
**NO.** El sistema funciona 100% en local (sin internet).
Solo necesitas internet para instalar dependencias por primera vez.

---

## 🛠️ Solución de Problemas

### Error: "Este script requiere permisos de administrador"
**Solución:**
```
1. Haz clic derecho en install-startup.bat
2. Selecciona "Ejecutar como administrador"
```

### Error: "node_modules no encontrado"
**Solución:** El script instalará automáticamente las dependencias.
Espera a que termine el proceso (puede tomar 2-5 minutos).

### El servidor no inicia automáticamente
**Verificar:**
1. Verifica que existe el acceso directo en:
   ```
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
   ```
2. Busca el archivo: `POS-Server.lnk`
3. Si no existe, ejecuta `install-startup.bat` de nuevo

### Puerto 3000 o 5000 ya en uso
**Solución:**
1. Abre el Administrador de Tareas (`Ctrl + Shift + Esc`)
2. Busca procesos `node.exe`
3. Termina los procesos
4. Ejecuta `start-server.bat` de nuevo

---

## 📋 Ubicación de Archivos

```
pos-web-professional/
│
├── start-server.bat           ← Inicia el servidor manualmente (CON ventanas)
├── start-server-hidden.vbs    ← Inicia el servidor OCULTO (SIN ventanas) ⭐
├── install-startup.bat        ← Instala en inicio automático (MODO OCULTO)
├── uninstall-startup.bat      ← Desinstala del inicio automático
├── update-from-github.bat     ← Actualiza desde GitHub (git pull) 🔄
├── stop-server.bat            ← Detiene todos los servidores 🛑
├── STARTUP-GUIDE.md           ← Este documento
│
├── backend/                   ← Código del servidor (API)
│   └── npm run dev            ← Puerto 5000
│
└── frontend/                  ← Código de la interfaz
    └── npm run dev            ← Puerto 3000
```

---

## ✅ Checklist de Instalación

- [ ] Ejecutar `install-startup.bat` como administrador
- [ ] Ver mensaje "INSTALACION EXITOSA!"
- [ ] Leer: "El servidor se ejecutara SIN VENTANAS VISIBLES"
- [ ] Reiniciar la computadora
- [ ] Verificar que NO aparecen ventanas (es normal, está en modo oculto)
- [ ] Abrir http://localhost:3000 en el navegador
- [ ] Si funciona: ¡Sistema funcionando en modo oculto! 🎉
- [ ] Para detener: Usar `stop-server.bat`
- [ ] Para actualizar: Usar `update-from-github.bat`

---

## 🔄 Actualizaciones

### Método Fácil (Recomendado):
```
1. Ejecuta: update-from-github.bat
2. Sigue las instrucciones en pantalla
3. Reinicia los servidores si estaban corriendo
```

### Método Manual:
```bash
git pull origin main
npm install  # Si hay cambios en package.json
```

El inicio automático seguirá funcionando sin necesidad de reinstalar.

**IMPORTANTE:** Después de actualizar, reinicia los servidores:
- Ejecuta `stop-server.bat` para detenerlos
- Ejecuta `start-server.bat` o reinicia la PC para iniciarlos de nuevo

---

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en las ventanas del servidor
2. Revisa este documento (STARTUP-GUIDE.md)
3. Ejecuta `uninstall-startup.bat` y luego `install-startup.bat` de nuevo

---

**✨ ¡Disfruta tu sistema POS Web Professional! ✨**
