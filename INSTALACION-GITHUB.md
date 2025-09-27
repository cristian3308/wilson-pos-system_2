# 📥 INSTALACIÓN DESDE GITHUB - Paso a Paso

## 🎯 **Método 1: Descarga Directa (MÁS FÁCIL)**

### ✅ **Paso 1: Descargar el Proyecto**
```bash
1. Ir a: https://github.com/TU_USUARIO/wilson-pos-system
2. Clic en botón verde "Code" 
3. Seleccionar "Download ZIP"
4. Extraer wilson-pos-system-main.zip en tu escritorio
```

### ✅ **Paso 2: Compilar Automáticamente**
```bash
1. Abrir la carpeta extraída
2. Buscar archivo: EMPAQUETADO-COMPLETO.bat
3. Clic derecho → "Ejecutar como administrador"
4. Esperar 3-5 minutos (se descarga todo automáticamente)
5. ¡Se crea Wilson POS System.exe listo para usar!
```

---

## 🔧 **Método 2: Con Git (Para Desarrolladores)**

### ✅ **Paso 1: Clonar Repositorio**
```bash
# Abrir Command Prompt o PowerShell
git clone https://github.com/TU_USUARIO/wilson-pos-system.git
cd wilson-pos-system
```

### ✅ **Paso 2: Instalar Dependencias**
```bash
# Instalar dependencias principales
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..

# Instalar dependencias del frontend  
cd frontend
npm install
cd ..
```

### ✅ **Paso 3: Compilar Proyecto**
```bash
# Compilar backend
npm run build:backend

# Compilar frontend
npm run build:frontend

# Crear ejecutable
npm run package:win
```

---

## 🚀 **Método 3: Un Solo Comando (RECOMENDADO)**

Si tienes Node.js instalado:
```bash
git clone https://github.com/TU_USUARIO/wilson-pos-system.git
cd wilson-pos-system
.\EMPAQUETADO-COMPLETO.bat
```

---

## 📋 **Requisitos Previos**

### **Para Método 1 (Solo compilar):**
- ✅ Windows 10 o superior
- ✅ Conexión a internet (solo para descargar)
- ✅ **NO necesita Node.js**

### **Para Método 2 y 3:**
- ✅ Node.js 18+ ([Descargar aquí](https://nodejs.org))
- ✅ Git ([Descargar aquí](https://git-scm.com))
- ✅ Windows 10 o superior

---

## 🎯 **Archivos que se Crean**

Después de la compilación tendrás:

```
📁 dist/
├── 📦 Wilson POS System Setup.exe    (Instalador - 150MB aprox)
├── 💼 Wilson POS System.exe          (Portable - 200MB aprox)
└── 📁 win-unpacked/                  (Archivos de la app)
```

---

## 🔧 **Solución de Problemas Comunes**

### ❌ **Error: "Node.js no encontrado"**
```bash
Solución: Instalar Node.js desde https://nodejs.org
Versión requerida: 18 o superior
```

### ❌ **Error: "npm no es reconocido"**
```bash
Solución: 
1. Reinstalar Node.js
2. Reiniciar Command Prompt
3. Verificar con: node --version
```

### ❌ **Error de permisos**
```bash
Solución: Ejecutar Command Prompt como Administrador
Clic derecho en CMD → "Ejecutar como administrador"
```

### ❌ **Error: "git no es reconocido"**
```bash
Solución: Instalar Git desde https://git-scm.com
O usar Método 1 (sin git)
```

---

## 📱 **Verificar Instalación Exitosa**

### ✅ **Signos de Éxito:**
- Se crea carpeta `dist/` con archivos .exe
- No hay errores rojos en consola
- Los archivos .exe son de ~150-200MB
- Al ejecutar se abre la aplicación Wilson POS

### ✅ **Primer Uso:**
```bash
1. Ejecutar Wilson POS System.exe
2. Se abre automáticamente en navegador: http://localhost:3000
3. Aparece dashboard de Wilson POS
4. ¡Sistema listo para usar!
```

---

## 🚀 **Distribución a Otros Equipos**

### **Opción A: Instalador Completo**
```bash
1. Enviar: Wilson POS System Setup.exe
2. Usuario ejecuta como administrador
3. Sigue asistente de instalación
4. Icono aparece en escritorio automáticamente
```

### **Opción B: Versión Portable**
```bash
1. Comprimir TODA la carpeta dist/ en un ZIP
2. Enviar el archivo ZIP
3. Usuario extrae y ejecuta Wilson POS System.exe
4. ¡Funciona inmediatamente sin instalar!
```

---

## 📞 **¿Necesitas Ayuda?**

### 🆘 **Contacto de Soporte:**
- 📧 **Email**: soporte@wilsonpos.com
- 📱 **WhatsApp**: +57 300 123 4567
- 💬 **GitHub Issues**: [Reportar problema](https://github.com/TU_USUARIO/wilson-pos-system/issues)

### 📚 **Documentación Adicional:**
- 📖 [Manual de Usuario](MANUAL-USO-RAPIDO.md)
- 🔧 [Guía Técnica](LEEME-DISTRIBUCION.md)
- ❓ [FAQ - Preguntas Frecuentes](FAQ.md)

---

<div align="center">

## 🎊 **¡Instalación Completada con Éxito!**

**Tu Wilson POS System está listo para transformar tu negocio** 🚗💎

</div>