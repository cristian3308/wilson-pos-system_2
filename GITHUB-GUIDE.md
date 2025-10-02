# 📤 Guía para Subir a GitHub - Paso a Paso

## 🎯 Objetivo
Subir el proyecto Wilson POS System a GitHub para que puedas clonarlo en cualquier computadora.

---

## ✅ PASO 1: Preparar el Proyecto

### 1.1 Verificar que Git esté instalado
```powershell
git --version
```

**Si no está instalado:**
- Descargar: https://git-scm.com/
- Instalar con opciones por defecto
- Reiniciar PowerShell

### 1.2 Configurar Git (Primera vez)
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### 1.3 Verificar archivos importantes
```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\crist\OneDrive\Escritorio\pos-web-professional

# Listar archivos
dir
```

**Debe contener:**
- ✅ `backend/`
- ✅ `frontend/`
- ✅ `install.bat`
- ✅ `start-dev.bat`
- ✅ `SETUP.md`
- ✅ `README.md`
- ✅ `.gitignore`

---

## 🚀 PASO 2: Crear Repositorio en GitHub

### 2.1 Ir a GitHub
1. Abrir: https://github.com/
2. Hacer login con tu cuenta

### 2.2 Crear nuevo repositorio
1. Click en el **botón verde "New"** (esquina superior derecha)
2. O ir a: https://github.com/new

### 2.3 Configurar el repositorio
- **Repository name**: `wilson-pos-system`
- **Description**: `Sistema POS para parqueadero y lavadero`
- **Visibility**: 
  - ✅ **Public** (si quieres que sea público)
  - ✅ **Private** (si quieres que sea privado)
- **NO marcar**: "Initialize this repository with:"
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license

### 2.4 Crear el repositorio
- Click en **"Create repository"**
- **COPIAR** la URL que aparece, ejemplo:
  ```
  https://github.com/cristian3308/wilson-pos-system.git
  ```

---

## 💻 PASO 3: Subir el Código (Desde PowerShell)

### 3.1 Abrir PowerShell en la carpeta del proyecto
```powershell
cd C:\Users\crist\OneDrive\Escritorio\pos-web-professional
```

### 3.2 Inicializar Git (si no está inicializado)
```powershell
git init
```

### 3.3 Agregar todos los archivos
```powershell
git add .
```

**Esto NO subirá** (gracias a .gitignore):
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ Archivos de base de datos
- ❌ Logs

### 3.4 Crear el primer commit
```powershell
git commit -m "Initial commit - Wilson POS System"
```

### 3.5 Conectar con GitHub
```powershell
git remote add origin https://github.com/cristian3308/wilson-pos-system.git
```

**IMPORTANTE**: Cambiar `cristian3308` por tu nombre de usuario de GitHub.

### 3.6 Cambiar a la rama main (si es necesario)
```powershell
git branch -M main
```

### 3.7 Subir el código a GitHub
```powershell
git push -u origin main
```

**Si pide usuario y contraseña:**
- Usuario: Tu nombre de usuario de GitHub
- Contraseña: Tu **Personal Access Token** (NO tu contraseña)

---

## 🔑 PASO 4: Crear Personal Access Token (Si es necesario)

Si Git pide contraseña y falla:

### 4.1 Crear Token
1. Ir a: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. Configurar:
   - **Note**: `Wilson POS Token`
   - **Expiration**: `90 days` (o lo que prefieras)
   - **Scopes**: Marcar ✅ **repo** (todos los permisos de repositorio)
4. Click en **"Generate token"**
5. **COPIAR EL TOKEN** (solo se muestra una vez)

### 4.2 Usar el Token
```powershell
# Cuando Git pida contraseña, pegar el TOKEN (no tu contraseña de GitHub)
git push -u origin main
```

---

## ✅ PASO 5: Verificar que se Subió Correctamente

### 5.1 Ir a tu repositorio en GitHub
```
https://github.com/cristian3308/wilson-pos-system
```

### 5.2 Verificar que aparezcan:
- ✅ Carpeta `backend/`
- ✅ Carpeta `frontend/`
- ✅ Archivos `.bat`
- ✅ Archivos `.md`
- ✅ README.md se muestra en la página

### 5.3 Verificar que NO aparezcan:
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ Archivos `.log`

---

## 📥 PASO 6: Clonar en Otra Computadora

Ahora en CUALQUIER otra computadora:

### 6.1 Instalar requisitos
- Git: https://git-scm.com/
- Node.js: https://nodejs.org/

### 6.2 Clonar el repositorio
```powershell
# Ir a donde quieras guardar el proyecto
cd C:\Users\TuUsuario\Desktop

# Clonar
git clone https://github.com/cristian3308/wilson-pos-system.git

# Entrar a la carpeta
cd wilson-pos-system
```

### 6.3 Instalar dependencias
```powershell
# Opción A: Automático
install.bat

# Opción B: Manual
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### 6.4 Ejecutar el proyecto
```powershell
start-dev.bat
```

¡Listo! Se abrirá automáticamente Chrome con la aplicación.

---

## 🔄 PASO 7: Actualizar el Código en GitHub

Cuando hagas cambios y quieras subirlos:

```powershell
# 1. Ver qué cambió
git status

# 2. Agregar todos los cambios
git add .

# 3. Crear commit con mensaje descriptivo
git commit -m "Descripción de los cambios"

# 4. Subir a GitHub
git push
```

---

## 📝 Comandos Útiles de Git

```powershell
# Ver estado actual
git status

# Ver historial de commits
git log --oneline

# Ver ramas
git branch

# Crear nueva rama
git checkout -b nueva-rama

# Cambiar de rama
git checkout main

# Ver diferencias
git diff

# Descartar cambios locales
git checkout -- archivo.txt

# Actualizar desde GitHub
git pull
```

---

## ⚠️ Errores Comunes y Soluciones

### Error: "fatal: not a git repository"
**Solución:** Ejecutar `git init` primero

### Error: "failed to push some refs"
**Solución:** Hacer `git pull` primero, luego `git push`

### Error: "Authentication failed"
**Solución:** Usar Personal Access Token en lugar de contraseña

### Error: "The file will have its original line endings"
**Solución:** Es solo una advertencia, puedes ignorarla

---

## 📦 Resumen de Archivos que se Subirán

### ✅ SE SUBE (Código fuente):
- `backend/src/` (~10 MB)
- `frontend/src/` (~10 MB)
- `backend/package.json`
- `frontend/package.json`
- Archivos `.bat`
- Archivos `.md`
- Configuraciones

### ❌ NO SE SUBE (Se regenera):
- `node_modules/` (~500 MB) ← Evita esto
- `.next/` (~50 MB) ← Evita esto
- `logs/` ← Datos locales
- `*.db` ← Base de datos local

**Tamaño en GitHub**: ~20-30 MB (muy ligero)

---

## 🎉 ¡Listo!

Tu proyecto está en GitHub y listo para:
- ✅ Clonarse en cualquier computadora
- ✅ Compartirse con tu equipo
- ✅ Tener respaldo en la nube
- ✅ Historial de cambios
- ✅ Colaboración

**URL de tu repositorio**:
```
https://github.com/cristian3308/wilson-pos-system
```

---

## 📞 Ayuda

- Documentación de Git: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Ver SETUP.md para más detalles del proyecto
