import React from 'react';
import { 
  CalculationMethod,
  CalculationMethodKey,
  CALCULATION_METHODS,
  CALCULATION_METHOD_CONFIGS,
  AsrMethod,
  AsrMethodKey,
  ASR_METHODS,
  ASR_METHOD_CONFIGS
} from '../types';

interface Props {
  selectedMethod: CalculationMethod;
  selectedAsrMethod: AsrMethod;
  onMethodChange: (method: CalculationMethod) => void;
  onAsrMethodChange: (method: AsrMethod) => void;
}

const CalculationMethodSelector: React.FC<Props> = ({ 
  selectedMethod, 
  selectedAsrMethod,
  onMethodChange,
  onAsrMethodChange 
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-center mb-2 text-white">Calculation Method</h2>
          <select
            id="method"
            value={selectedMethod}
            onChange={(e) => {
              const method = e.target.value as CalculationMethodKey;
              if (method in CALCULATION_METHODS) {
                onMethodChange(CALCULATION_METHODS[method]);
              }
            }}
            className="block w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
          >
            {Object.entries(CALCULATION_METHOD_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-medium text-center mb-2 text-white">Asr Calculation Method</h2>
          <select
            id="school"
            value={selectedAsrMethod}
            onChange={(e) => {
              const method = e.target.value as AsrMethodKey;
              if (method in ASR_METHODS) {
                onAsrMethodChange(ASR_METHODS[method]);
              }
            }}
            className="block w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
          >
            {Object.entries(ASR_METHOD_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-center text-white mb-4">
          {CALCULATION_METHOD_CONFIGS[selectedMethod as CalculationMethodKey].name}
        </h3>
        
        <div className="space-y-2 text-gray-300 text-center">
          <div>• Fajr Angle: {CALCULATION_METHOD_CONFIGS[selectedMethod as CalculationMethodKey].params.Fajr}°</div>
          <div>• Isha: {CALCULATION_METHOD_CONFIGS[selectedMethod as CalculationMethodKey].params.Isha}</div>
          <div>• Region: {CALCULATION_METHOD_CONFIGS[selectedMethod as CalculationMethodKey].location?.latitude.toFixed(2)}°, {CALCULATION_METHOD_CONFIGS[selectedMethod as CalculationMethodKey].location?.longitude.toFixed(2)}°</div>
          <div>• Asr: {ASR_METHOD_CONFIGS[selectedAsrMethod as AsrMethodKey].description}</div>
        </div>
      </div>
    </div>
  );
};

export default CalculationMethodSelector; 