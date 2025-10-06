# 🚀 Scripts de Inicio Automático - POS Web Professional

Este documento explica cómo usar los scripts `.bat` para iniciar automáticamente el servidor POS cuando enciendes tu computadora.

---

## 📁 Archivos Incluidos

### 1️⃣ `start-server.bat`
**Función:** Inicia el servidor POS (Backend + Frontend)

**Qué hace:**
- ✅ Verifica e instala dependencias si es necesario
- ✅ Inicia el Backend en una ventana separada (Puerto 5000)
- ✅ Inicia el Frontend en una ventana separada (Puerto 3000)
- ✅ Mantiene ambos servidores ejecutándose
- ✅ Se cierra automáticamente después de iniciar

**Uso manual:**
```
Doble clic en start-server.bat
```

---

### 2️⃣ `install-startup.bat`
**Función:** Instala el servidor en el inicio automático de Windows

**Qué hace:**
- ✅ Crea un acceso directo en la carpeta de Inicio de Windows
- ✅ Configura el servidor para iniciarse automáticamente al encender la PC
- ✅ Ejecuta el servidor en segundo plano

**Uso:**
```
1. Haz clic derecho en install-startup.bat
2. Selecciona "Ejecutar como administrador"
3. Espera el mensaje de confirmación
4. ¡Listo! El servidor se iniciará automáticamente
```

---

### 3️⃣ `uninstall-startup.bat`
**Función:** Desinstala el inicio automático

**Qué hace:**
- ✅ Elimina el acceso directo del inicio automático
- ✅ El servidor ya NO se iniciará al encender la PC

**Uso:**
```
Doble clic en uninstall-startup.bat
```

---

## 🎯 Guía de Instalación Rápida

### Paso 1: Instalar en Inicio Automático
```
1. Haz clic derecho en: install-startup.bat
2. Selecciona: "Ejecutar como administrador"
3. Espera el mensaje: "INSTALACION EXITOSA!"
```

### Paso 2: Probar (Opcional)
```
Doble clic en: start-server.bat
```

### Paso 3: Reiniciar
```
Reinicia tu computadora para verificar que el servidor inicia automáticamente
```

---

## 🔧 Configuración del Sistema

### URLs de Acceso
- **Frontend (Interfaz):** http://localhost:3000
- **Backend (API):** http://localhost:5000

### Ventanas Abiertas
Cuando el servidor está ejecutándose verás **2 ventanas**:
- `POS Backend` - Servidor Node.js (Backend)
- `POS Frontend` - Servidor Next.js (Frontend)

**⚠️ NO CIERRES ESTAS VENTANAS** mientras uses el sistema POS

---

## ❓ Preguntas Frecuentes

### ¿Cómo sé si el servidor está funcionando?
1. Busca las ventanas: `POS Backend` y `POS Frontend`
2. Abre tu navegador en: http://localhost:3000
3. Deberías ver la interfaz del POS

### ¿Cómo detengo el servidor?
**Opción 1:** Cierra las ventanas `POS Backend` y `POS Frontend`
**Opción 2:** Presiona `Ctrl + C` en cada ventana

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
├── start-server.bat           ← Inicia el servidor manualmente
├── install-startup.bat        ← Instala en inicio automático
├── uninstall-startup.bat      ← Desinstala del inicio automático
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
- [ ] Probar con `start-server.bat` (opcional)
- [ ] Reiniciar la computadora
- [ ] Verificar que las ventanas `POS Backend` y `POS Frontend` aparecen
- [ ] Abrir http://localhost:3000 en el navegador
- [ ] ¡Sistema funcionando! 🎉

---

## 🔄 Actualizaciones

Cuando actualices el proyecto desde GitHub:
```bash
git pull origin main
```

El inicio automático seguirá funcionando sin necesidad de reinstalar.

---

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en las ventanas del servidor
2. Revisa este documento (STARTUP-GUIDE.md)
3. Ejecuta `uninstall-startup.bat` y luego `install-startup.bat` de nuevo

---

**✨ ¡Disfruta tu sistema POS Web Professional! ✨**
