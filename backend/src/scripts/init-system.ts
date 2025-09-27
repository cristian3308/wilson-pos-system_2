#!/usr/bin/env node

import mongoose from 'mongoose';
import { TipoVehiculo, ServicioLavadero, Configuracion } from '../models/ParkingModels';
import logger from '../utils/logger';

// Conectar a la base de datos
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_system';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Datos iniciales del sistema
const inicializarSistema = async () => {
  try {
    console.log('🚀 Iniciando configuración del sistema...');

    // Verificar si ya existen datos
    const tiposExistentes = await TipoVehiculo.countDocuments();
    const serviciosExistentes = await ServicioLavadero.countDocuments();

    if (tiposExistentes > 0 && serviciosExistentes > 0) {
      console.log('ℹ️  Los datos ya están inicializados');
      process.exit(0);
    }

    // Tipos de vehículos por defecto
    const tiposVehiculos = [
      {
        nombre: 'Carro',
        precio_hora: 3000,
        precio_fraccion: 1000,
        minutos_fraccion: 15
      },
      {
        nombre: 'Moto',
        precio_hora: 2000,
        precio_fraccion: 500,
        minutos_fraccion: 15
      },
      {
        nombre: 'Bicicleta',
        precio_hora: 1000,
        precio_fraccion: 300,
        minutos_fraccion: 15
      },
      {
        nombre: 'Camioneta',
        precio_hora: 4000,
        precio_fraccion: 1500,
        minutos_fraccion: 15
      }
    ];

    // Servicios de lavadero por defecto
    const serviciosLavadero = [
      {
        nombre: 'Lavado Simple',
        precio: 8000,
        duracion_minutos: 30,
        descripcion: 'Lavado exterior básico'
      },
      {
        nombre: 'Lavado Completo',
        precio: 15000,
        duracion_minutos: 60,
        descripcion: 'Lavado exterior e interior'
      },
      {
        nombre: 'Lavado Premium',
        precio: 25000,
        duracion_minutos: 90,
        descripcion: 'Lavado completo + encerado + aspirado'
      },
      {
        nombre: 'Solo Aspirado',
        precio: 5000,
        duracion_minutos: 20,
        descripcion: 'Aspirado interior únicamente'
      },
      {
        nombre: 'Encerado',
        precio: 12000,
        duracion_minutos: 45,
        descripcion: 'Aplicación de cera protectora'
      }
    ];

    // Configuraciones del sistema
    const configuraciones = [
      {
        clave: 'espacios_totales',
        valor: '50',
        descripcion: 'Número total de espacios de parqueo'
      },
      {
        clave: 'nombre_establecimiento',
        valor: 'ParqueoSystem',
        descripcion: 'Nombre del establecimiento'
      },
      {
        clave: 'direccion',
        valor: 'Calle 123 # 45-67',
        descripcion: 'Dirección del establecimiento'
      },
      {
        clave: 'telefono',
        valor: '123-456-7890',
        descripcion: 'Teléfono de contacto'
      },
      {
        clave: 'horario_funcionamiento',
        valor: '24 horas',
        descripcion: 'Horario de funcionamiento'
      }
    ];

    // Insertar tipos de vehículos
    console.log('📝 Creando tipos de vehículos...');
    await TipoVehiculo.insertMany(tiposVehiculos);
    console.log(`✅ ${tiposVehiculos.length} tipos de vehículos creados`);

    // Insertar servicios de lavadero
    console.log('🧽 Creando servicios de lavadero...');
    await ServicioLavadero.insertMany(serviciosLavadero);
    console.log(`✅ ${serviciosLavadero.length} servicios de lavadero creados`);

    // Insertar configuraciones
    console.log('⚙️  Creando configuraciones del sistema...');
    await Configuracion.insertMany(configuraciones);
    console.log(`✅ ${configuraciones.length} configuraciones creadas`);

    console.log('🎉 Sistema inicializado correctamente!');
    console.log('');
    console.log('Datos creados:');
    console.log(`- ${tiposVehiculos.length} tipos de vehículos`);
    console.log(`- ${serviciosLavadero.length} servicios de lavadero`);
    console.log(`- ${configuraciones.length} configuraciones del sistema`);

  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
    process.exit(1);
  }
};

// Función principal
const main = async () => {
  await connectDB();
  await inicializarSistema();
  await mongoose.disconnect();
  console.log('✅ Desconectado de MongoDB');
  process.exit(0);
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { inicializarSistema };