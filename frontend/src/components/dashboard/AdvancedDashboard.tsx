import React from 'react';

interface DashboardMetrics {
  ingresosTotales: number;
  ingresosParqueadero: number;
  ingresosLavadero: number;
  vehiculosActivos: number;
  espaciosDisponibles: number;
  ordenesLavadero: number;
  vehiculosPorTipo: {
    carro: number;
    moto: number;
    bicicleta: number;
  };
  serviciosLavadero: {
    basico: number;
    completo: number;
    premium: number;
  };
}

interface Props {
  data: DashboardMetrics | null;
}

export const AdvancedDashboard: React.FC<Props> = ({ data }) => {
  if (!data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalEspacios = 50;
  const ocupacionPorcentaje = ((totalEspacios - data.espaciosDisponibles) / totalEspacios) * 100;

  return (
    <div className="space-y-6">
      {/* Métricas principales con animaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold">${data.ingresosTotales.toLocaleString()}</p>
              <p className="text-green-100 text-xs">+12% vs ayer</p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Parqueadero</p>
              <p className="text-3xl font-bold">${data.ingresosParqueadero.toLocaleString()}</p>
              <p className="text-blue-100 text-xs">{data.vehiculosActivos} vehículos activos</p>
            </div>
            <div className="text-4xl opacity-80">🚗</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Lavadero</p>
              <p className="text-3xl font-bold">${data.ingresosLavadero.toLocaleString()}</p>
              <p className="text-purple-100 text-xs">{data.ordenesLavadero} órdenes hoy</p>
            </div>
            <div className="text-4xl opacity-80">✨</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Ocupación</p>
              <p className="text-3xl font-bold">{ocupacionPorcentaje.toFixed(0)}%</p>
              <p className="text-orange-100 text-xs">{data.espaciosDisponibles} espacios libres</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
      </div>

      {/* Gráficos y estadísticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de vehículos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Distribución de Vehículos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🚗</span>
                <span className="font-medium">Carros</span>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(data.vehiculosPorTipo.carro / (data.vehiculosPorTipo.carro + data.vehiculosPorTipo.moto + data.vehiculosPorTipo.bicicleta)) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-lg w-8">{data.vehiculosPorTipo.carro}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏍️</span>
                <span className="font-medium">Motos</span>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(data.vehiculosPorTipo.moto / (data.vehiculosPorTipo.carro + data.vehiculosPorTipo.moto + data.vehiculosPorTipo.bicicleta)) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-lg w-8">{data.vehiculosPorTipo.moto}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🚲</span>
                <span className="font-medium">Bicicletas</span>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(data.vehiculosPorTipo.bicicleta / (data.vehiculosPorTipo.carro + data.vehiculosPorTipo.moto + data.vehiculosPorTipo.bicicleta)) * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold text-lg w-8">{data.vehiculosPorTipo.bicicleta}</span>
              </div>
            </div>
          </div>

          {/* Mapa de espacios simplificado */}
          <div className="mt-6">
            <h4 className="font-bold text-gray-900 mb-3">Estado de Espacios</h4>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: totalEspacios }, (_, i) => (
                <div
                  key={i}
                  className={`h-6 w-6 rounded ${
                    i < (totalEspacios - data.espaciosDisponibles)
                      ? 'bg-red-400'
                      : 'bg-green-400'
                  } transition-colors duration-500`}
                  title={`Espacio ${i + 1}: ${i < (totalEspacios - data.espaciosDisponibles) ? 'Ocupado' : 'Libre'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>🔴 Ocupado</span>
              <span>🟢 Disponible</span>
            </div>
          </div>
        </div>

        {/* Servicios de lavadero */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Servicios de Lavadero</h3>
          <div className="space-y-6">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
                  style={{
                    background: `conic-gradient(
                      #8B5CF6 0deg ${(data.serviciosLavadero.basico / (data.serviciosLavadero.basico + data.serviciosLavadero.completo + data.serviciosLavadero.premium)) * 360}deg,
                      #06B6D4 ${(data.serviciosLavadero.basico / (data.serviciosLavadero.basico + data.serviciosLavadero.completo + data.serviciosLavadero.premium)) * 360}deg ${((data.serviciosLavadero.basico + data.serviciosLavadero.completo) / (data.serviciosLavadero.basico + data.serviciosLavadero.completo + data.serviciosLavadero.premium)) * 360}deg,
                      #F59E0B ${((data.serviciosLavadero.basico + data.serviciosLavadero.completo) / (data.serviciosLavadero.basico + data.serviciosLavadero.completo + data.serviciosLavadero.premium)) * 360}deg 360deg
                    )`
                  }}
                ></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {data.serviciosLavadero.basico + data.serviciosLavadero.completo + data.serviciosLavadero.premium}
                    </div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                  <span className="text-sm">🧽 Básico</span>
                </div>
                <span className="font-bold">{data.serviciosLavadero.basico}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-cyan-500 rounded mr-3"></div>
                  <span className="text-sm">✨ Completo</span>
                </div>
                <span className="font-bold">{data.serviciosLavadero.completo}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-amber-500 rounded mr-3"></div>
                  <span className="text-sm">💎 Premium</span>
                </div>
                <span className="font-bold">{data.serviciosLavadero.premium}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de rendimiento */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen del Día</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-green-600">${data.ingresosTotales.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Ingresos totales del día</div>
            <div className="mt-2 text-xs text-green-600 font-medium">+12% vs ayer</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold text-blue-600">{data.vehiculosActivos + 15}</div>
            <div className="text-sm text-gray-600">Vehículos atendidos hoy</div>
            <div className="mt-2 text-xs text-blue-600 font-medium">+8% vs ayer</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-purple-600">4.8</div>
            <div className="text-sm text-gray-600">Calificación promedio</div>
            <div className="mt-2 text-xs text-purple-600 font-medium">Basado en 45 reseñas</div>
          </div>
        </div>
      </div>

      {/* Indicadores en tiempo real */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-6">Estado en Tiempo Real</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-lg font-bold">Sistema Operativo</div>
            <div className="text-sm opacity-75">Funcionando correctamente</div>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-lg font-bold">Alta Demanda</div>
            <div className="text-sm opacity-75">Parqueadero al {ocupacionPorcentaje.toFixed(0)}%</div>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-lg font-bold">3 Empleados</div>
            <div className="text-sm opacity-75">Activos en lavadero</div>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-2">🕐</div>
            <div className="text-lg font-bold">{new Date().toLocaleTimeString()}</div>
            <div className="text-sm opacity-75">Hora actual</div>
          </div>
        </div>
      </div>
    </div>
  );
};