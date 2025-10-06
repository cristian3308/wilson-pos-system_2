# 📦 Resumen de Scripts - POS Web Professional

## 🚀 Archivos Creados

### ✅ Nuevos Scripts

| Archivo | Función | Modo |
|---------|---------|------|
| `start-server.bat` | Inicia servidores | **CON ventanas** (manual) |
| `start-server-hidden.vbs` | Inicia servidores | **SIN ventanas** (oculto) ⭐ |
| `install-startup.bat` | Instala en inicio automático | Modo oculto |
| `uninstall-startup.bat` | Desinstala del inicio | - |
| `update-from-github.bat` | Actualiza con git pull | Con gestión de cambios 🔄 |
| `stop-server.bat` | Detiene servidores | Para modo oculto 🛑 |

---

## 🎯 Instrucciones de Uso

### 1️⃣ Primera Instalación

```bash
# Paso 1: Haz clic derecho en install-startup.bat
# Paso 2: Selecciona "Ejecutar como administrador"
# Paso 3: Reinicia tu computadora
# Paso 4: Los servidores se iniciarán AUTOMÁTICAMENTE (sin ventanas)
```

**Resultado:** El servidor se iniciará cada vez que enciendas la PC, completamente oculto.

---

### 2️⃣ Verificar que Funciona

```bash
# Abre tu navegador
http://localhost:3000  # Frontend (Interfaz POS)
http://localhost:5000  # Backend (API)
```

Si ves la interfaz del POS, ¡está funcionando! 🎉

---

### 3️⃣ Actualizar desde GitHub

```bash
# Doble clic en: update-from-github.bat
```

**Qué hace:**
1. ✅ Guarda tus cambios locales (git stash)
2. ✅ Descarga cambios desde GitHub (git pull)
3. ✅ Restaura tus cambios locales
4. ✅ Actualiza dependencias (npm install)
5. ✅ Muestra instrucciones para reiniciar

---

### 4️⃣ Detener Servidores

```bash
# Doble clic en: stop-server.bat
```

Útil cuando el servidor está en modo oculto y quieres detenerlo.

---

### 5️⃣ Desinstalar Inicio Automático

```bash
# Doble clic en: uninstall-startup.bat
```

---

## 🔧 Modo Manual vs Modo Oculto

### 📺 Modo Manual (start-server.bat)
- ✅ Muestra 2 ventanas: Backend + Frontend
- ✅ Puedes ver los logs en tiempo real
- ✅ Útil para desarrollo o depuración
- ❌ Las ventanas ocupan espacio en la barra de tareas

### 🔇 Modo Oculto (start-server-hidden.vbs)
- ✅ No muestra NINGUNA ventana
- ✅ Servidores corren en segundo plano
- ✅ Perfecto para producción/uso diario
- ✅ Se inicia automáticamente con Windows
- ⚠️ Para detener: Usa `stop-server.bat`

---

## ❓ Preguntas Frecuentes

### ¿Cómo sé si el servidor está corriendo en modo oculto?
```bash
# Opción 1: Abre http://localhost:3000 en tu navegador
# Si funciona, está corriendo

# Opción 2: Abre el Administrador de Tareas (Ctrl+Shift+Esc)
# Busca procesos "node.exe" (deberías ver 2)
```

### ¿Cómo actualizo el proyecto?
```bash
# Ejecuta: update-from-github.bat
# Sigue las instrucciones en pantalla
```

### ¿El servidor consume muchos recursos?
- **RAM:** ~300-500 MB
- **CPU:** ~2-5% en reposo
- Consume pocos recursos cuando está en modo oculto

### ¿Necesito internet?
- **Para instalar:** Sí (solo la primera vez)
- **Para usar:** NO (funciona 100% offline)
- **Para actualizar:** Sí (solo cuando ejecutas update-from-github.bat)

---

## 🛠️ Solución de Problemas

### El servidor no inicia automáticamente
```bash
1. Verifica que existe el acceso directo en:
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

2. Busca: POS-Server.lnk

3. Si no existe, ejecuta install-startup.bat de nuevo
```

### Quiero ver las ventanas del servidor
```bash
# Ejecuta stop-server.bat para detener el modo oculto
# Luego ejecuta start-server.bat para ver las ventanas
```

### Error al actualizar con update-from-github.bat
```bash
# Posibles causas:
- Sin conexión a internet
- Conflictos con cambios locales
- El script guardará tus cambios automáticamente con stash
```

---

## 📋 Checklist Completo

- [ ] Ejecutar `install-startup.bat` como administrador
- [ ] Ver mensaje "INSTALACION EXITOSA!"
- [ ] Leer: "El servidor se ejecutará SIN VENTANAS VISIBLES"
- [ ] Reiniciar la computadora
- [ ] Verificar que NO aparecen ventanas (es normal)
- [ ] Abrir http://localhost:3000
- [ ] Ver la interfaz del POS funcionando
- [ ] Probar `update-from-github.bat` para actualizar
- [ ] Probar `stop-server.bat` para detener
- [ ] ¡Sistema completamente funcional! 🎉

---

## 📞 Comandos Rápidos

| Acción | Comando |
|--------|---------|
| Instalar inicio automático | `install-startup.bat` (como admin) |
| Iniciar manualmente (con ventanas) | `start-server.bat` |
| Iniciar oculto | `start-server-hidden.vbs` |
| Detener servidores | `stop-server.bat` |
| Actualizar desde GitHub | `update-from-github.bat` |
| Desinstalar inicio automático | `uninstall-startup.bat` |

---

**✨ Sistema POS Web Professional - Totalmente Automatizado ✨**

🔗 GitHub: wilson-pos-system_2
👤 Owner: cristian3308
🌿 Branch: main
