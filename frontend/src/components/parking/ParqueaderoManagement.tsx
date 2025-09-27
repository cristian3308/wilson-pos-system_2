import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface Vehiculo {
  id: string;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'bicicleta';
  espacioAsignado: string;
  horaEntrada: string;
  propietario?: string;
  telefono?: string;
  observaciones?: string;
  tiempoTranscurrido?: string;
  costoActual?: number;
}

interface TarifaConfig {
  carro: { hora: number; dia: number };
  moto: { hora: number; dia: number };
  bicicleta: { hora: number; dia: number };
}

export const ParqueaderoManagement: React.FC = () => {
  const [vehiculosActivos, setVehiculosActivos] = useState<Vehiculo[]>([]);
  const [mode, setMode] = useState<'entrada' | 'salida' | 'gestion'>('entrada');
  const [loading, setLoading] = useState(false);
  const [tarifas, setTarifas] = useState<TarifaConfig>({
    carro: { hora: 3000, dia: 25000 },
    moto: { hora: 2000, dia: 15000 },
    bicicleta: { hora: 1000, dia: 8000 }
  });

  // Formulario de entrada
  const [entradaForm, setEntradaForm] = useState({
    placa: '',
    tipoVehiculo: 'carro' as 'carro' | 'moto' | 'bicicleta',
    propietario: '',
    telefono: '',
    observaciones: ''
  });

  // Estado para búsqueda y salida
  const [busquedaPlaca, setBusquedaPlaca] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);

  useEffect(() => {
    loadVehiculosActivos();
    const interval = setInterval(loadVehiculosActivos, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadVehiculosActivos = async () => {
    try {
      const response = await apiService.getVehiculosActivos();
      setVehiculosActivos(response.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      // En caso de error, mantener lista vacía
      setVehiculosActivos([]);
    }
  };

  const calcularCosto = (tipoVehiculo: string, horaEntrada: string) => {
    const ahora = new Date();
    const entrada = new Date(horaEntrada);
    const horasTranscurridas = Math.ceil((ahora.getTime() - entrada.getTime()) / (1000 * 60 * 60));
    
    const tarifa = tarifas[tipoVehiculo as keyof TarifaConfig];
    if (horasTranscurridas >= 8) {
      return tarifa.dia;
    } else {
      return tarifa.hora * horasTranscurridas;
    }
  };

  const calcularTiempo = (horaEntrada: string) => {
    const ahora = new Date();
    const entrada = new Date(horaEntrada);
    const diff = ahora.getTime() - entrada.getTime();
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}min`;
  };

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiService.get('/api/v1/parqueadero/entrada');
      
      // Simular registro exitoso
      const nuevoVehiculo: Vehiculo = {
        id: Date.now().toString(),
        ...entradaForm,
        espacioAsignado: `${entradaForm.tipoVehiculo === 'carro' ? 'A' : entradaForm.tipoVehiculo === 'moto' ? 'M' : 'B'}-${Math.floor(Math.random() * 50) + 1}`,
        horaEntrada: new Date().toISOString(),
        tiempoTranscurrido: '0h 0min',
        costoActual: 0
      };
      
      setVehiculosActivos([...vehiculosActivos, nuevoVehiculo]);
      setEntradaForm({
        placa: '',
        tipoVehiculo: 'carro',
        propietario: '',
        telefono: '',
        observaciones: ''
      });
      
      alert(`✅ Vehículo registrado exitosamente!\n\nPlaca: ${nuevoVehiculo.placa}\nEspacio: ${nuevoVehiculo.espacioAsignado}\nHora de entrada: ${new Date().toLocaleTimeString()}`);
      
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      alert('❌ Error al registrar el vehículo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalida = async () => {
    if (!vehiculoSeleccionado) return;
    
    const costo = calcularCosto(vehiculoSeleccionado.tipoVehiculo, vehiculoSeleccionado.horaEntrada);
    const tiempo = calcularTiempo(vehiculoSeleccionado.horaEntrada);
    
    const confirmar = window.confirm(
      `🚗 Procesando salida del vehículo\n\n` +
      `Placa: ${vehiculoSeleccionado.placa}\n` +
      `Tipo: ${vehiculoSeleccionado.tipoVehiculo.toUpperCase()}\n` +
      `Espacio: ${vehiculoSeleccionado.espacioAsignado}\n` +
      `Tiempo: ${tiempo}\n` +
      `Costo total: $${costo.toLocaleString()}\n\n` +
      `¿Procesar salida y cobro?`
    );
    
    if (confirmar) {
      setLoading(true);
      try {
        // Aquí iría la llamada al API
        setVehiculosActivos(vehiculosActivos.filter(v => v.id !== vehiculoSeleccionado.id));
        setVehiculoSeleccionado(null);
        setBusquedaPlaca('');
        
        alert(`✅ Salida procesada exitosamente!\n\nTotal cobrado: $${costo.toLocaleString()}\nGracias por usar nuestro servicio.`);
        
      } catch (error) {
        console.error('Error al procesar salida:', error);
        alert('❌ Error al procesar la salida. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const buscarVehiculo = () => {
    const vehiculo = vehiculosActivos.find(v => 
      v.placa.toLowerCase().includes(busquedaPlaca.toLowerCase())
    );
    setVehiculoSeleccionado(vehiculo || null);
  };

  const renderEntrada = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
          <span className="text-white text-xl">🚗</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Entrada</h2>
      </div>

      <form onSubmit={handleEntrada} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placa del Vehículo *
            </label>
            <input
              type="text"
              value={entradaForm.placa}
              onChange={(e) => setEntradaForm({...entradaForm, placa: e.target.value.toUpperCase()})}
              placeholder="Ej: ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vehículo *
            </label>
            <select
              value={entradaForm.tipoVehiculo}
              onChange={(e) => setEntradaForm({...entradaForm, tipoVehiculo: e.target.value as any})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              <option value="carro">🚗 Carro - $3,000/hora</option>
              <option value="moto">🏍️ Moto - $2,000/hora</option>
              <option value="bicicleta">🚲 Bicicleta - $1,000/hora</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propietario
            </label>
            <input
              type="text"
              value={entradaForm.propietario}
              onChange={(e) => setEntradaForm({...entradaForm, propietario: e.target.value})}
              placeholder="Nombre del propietario"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={entradaForm.telefono}
              onChange={(e) => setEntradaForm({...entradaForm, telefono: e.target.value})}
              placeholder="Número de contacto"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={entradaForm.observaciones}
            onChange={(e) => setEntradaForm({...entradaForm, observaciones: e.target.value})}
            placeholder="Observaciones adicionales (opcional)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !entradaForm.placa}
          className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? '⏳ Registrando...' : '✅ Registrar Entrada'}
        </button>
      </form>
    </div>
  );

  const renderSalida = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-4">
          <span className="text-white text-xl">🚪</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Salida</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Vehículo por Placa
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={busquedaPlaca}
              onChange={(e) => setBusquedaPlaca(e.target.value.toUpperCase())}
              placeholder="Ingrese placa del vehículo"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            <button
              onClick={buscarVehiculo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Buscar
            </button>
          </div>
        </div>

        {vehiculoSeleccionado && (
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Información del Vehículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Placa:</span>
                <p className="font-bold text-lg">{vehiculoSeleccionado.placa}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tipo:</span>
                <p className="font-bold text-lg">{vehiculoSeleccionado.tipoVehiculo.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Espacio:</span>
                <p className="font-bold text-lg">{vehiculoSeleccionado.espacioAsignado}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Hora Entrada:</span>
                <p className="font-bold text-lg">{new Date(vehiculoSeleccionado.horaEntrada).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tiempo Transcurrido:</span>
                <p className="font-bold text-lg text-blue-600">{calcularTiempo(vehiculoSeleccionado.horaEntrada)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Costo Actual:</span>
                <p className="font-bold text-2xl text-green-600">
                  ${calcularCosto(vehiculoSeleccionado.tipoVehiculo, vehiculoSeleccionado.horaEntrada).toLocaleString()}
                </p>
              </div>
              {vehiculoSeleccionado.propietario && (
                <div>
                  <span className="text-sm text-gray-600">Propietario:</span>
                  <p className="font-bold">{vehiculoSeleccionado.propietario}</p>
                </div>
              )}
              {vehiculoSeleccionado.telefono && (
                <div>
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <p className="font-bold">{vehiculoSeleccionado.telefono}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSalida}
              disabled={loading}
              className="w-full mt-6 bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 text-lg font-medium"
            >
              {loading ? '⏳ Procesando...' : '🚪 Procesar Salida y Cobro'}
            </button>
          </div>
        )}

        {busquedaPlaca && !vehiculoSeleccionado && busquedaPlaca.length > 2 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-gray-600">No se encontró ningún vehículo con la placa "{busquedaPlaca}"</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGestion = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
            <span className="text-white text-xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h2>
        </div>
        <div className="text-sm text-gray-600">
          Vehículos activos: <span className="font-bold text-blue-600">{vehiculosActivos.length}</span>
        </div>
      </div>

      {vehiculosActivos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🅿️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay vehículos actualmente</h3>
          <p className="text-gray-600">El parqueadero está vacío en este momento</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Espacio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehiculosActivos.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {vehiculo.tipoVehiculo === 'carro' ? '🚗' : 
                         vehiculo.tipoVehiculo === 'moto' ? '🏍️' : '🚲'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vehiculo.placa}</div>
                        <div className="text-sm text-gray-500">{vehiculo.propietario || 'Sin registrar'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {vehiculo.espacioAsignado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(vehiculo.horaEntrada).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {calcularTiempo(vehiculo.horaEntrada)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ${calcularCosto(vehiculo.tipoVehiculo, vehiculo.horaEntrada).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setVehiculoSeleccionado(vehiculo);
                        setBusquedaPlaca(vehiculo.placa);
                        setMode('salida');
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      🚪 Procesar Salida
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md p-1">
        <nav className="flex space-x-1">
          <button
            onClick={() => setMode('entrada')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'entrada'
                ? 'bg-green-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            🚗 Entrada de Vehículos
          </button>
          <button
            onClick={() => setMode('salida')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'salida'
                ? 'bg-red-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            🚪 Salida de Vehículos
          </button>
          <button
            onClick={() => setMode('gestion')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'gestion'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Gestión de Espacios
          </button>
        </nav>
      </div>

      {/* Content */}
      {mode === 'entrada' && renderEntrada()}
      {mode === 'salida' && renderSalida()}
      {mode === 'gestion' && renderGestion()}
    </div>
  );
};