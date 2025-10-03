import React from 'react';

interface ProductSpecificationsFormProps {
  specifications?: any;
  onSpecificationsChange?: (specifications: any) => void;
  className?: string;
}

const ProductSpecificationsForm: React.FC<ProductSpecificationsFormProps> = ({
  specifications = {},
  onSpecificationsChange,
  className = ''
}) => {
  const handleSpecificationChange = (key: string, value: string) => {
    const updatedSpecs = {
      ...specifications,
      [key]: value
    };
    onSpecificationsChange?.(updatedSpecs);
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    const updatedSpecs = {
      ...specifications,
      [key]: checked
    };
    onSpecificationsChange?.(updatedSpecs);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h3>
      
      {/* Material & Construction */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Material & Construction</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fabric</label>
            <input
              type="text"
              value={specifications.fabric || ''}
              onChange={(e) => handleSpecificationChange('fabric', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Cotton, Silk, Polyester"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <input
              type="text"
              value={specifications.material || ''}
              onChange={(e) => handleSpecificationChange('material', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Cotton, Polyester, Leather"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
            <input
              type="text"
              value={specifications.pattern || ''}
              onChange={(e) => handleSpecificationChange('pattern', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Solid, Striped, Floral"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
            <input
              type="text"
              value={specifications.finish || ''}
              onChange={(e) => handleSpecificationChange('finish', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Matte, Glossy, Textured"
            />
          </div>
        </div>
      </div>

      {/* Fit & Design */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Fit & Design</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
            <input
              type="text"
              value={specifications.fit || ''}
              onChange={(e) => handleSpecificationChange('fit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Regular, Slim, Loose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neckline</label>
            <input
              type="text"
              value={specifications.neckline || ''}
              onChange={(e) => handleSpecificationChange('neckline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Round, V-neck, Collar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleeves</label>
            <input
              type="text"
              value={specifications.sleeves || ''}
              onChange={(e) => handleSpecificationChange('sleeves', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Full, Half, Sleeveless"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
            <input
              type="text"
              value={specifications.length || ''}
              onChange={(e) => handleSpecificationChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Regular, Long, Short"
            />
          </div>
        </div>
      </div>

      {/* Care Instructions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Care Instructions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wash Care</label>
            <input
              type="text"
              value={specifications.washCare || ''}
              onChange={(e) => handleSpecificationChange('washCare', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Machine wash cold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ironing Instructions</label>
            <input
              type="text"
              value={specifications.ironingInstructions || ''}
              onChange={(e) => handleSpecificationChange('ironingInstructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Iron on medium heat"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="dryClean"
              checked={specifications.dryClean || false}
              onChange={(e) => handleCheckboxChange('dryClean', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="dryClean" className="ml-2 block text-sm text-gray-700">
              Dry Clean Only
            </label>
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Physical Properties</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
            <input
              type="text"
              value={specifications.dimensions || ''}
              onChange={(e) => handleSpecificationChange('dimensions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 30cm x 40cm x 10cm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
            <input
              type="text"
              value={specifications.weight || ''}
              onChange={(e) => handleSpecificationChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 200g"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="text"
              value={specifications.capacity || ''}
              onChange={(e) => handleSpecificationChange('capacity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 500ml, 2L"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
            <input
              type="text"
              value={specifications.volume || ''}
              onChange={(e) => handleSpecificationChange('volume', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1.5L, 250ml"
            />
          </div>
        </div>
      </div>

      {/* Safety & Compliance */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">Safety & Compliance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="microwaveSafe"
              checked={specifications.microwaveSafe || false}
              onChange={(e) => handleCheckboxChange('microwaveSafe', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="microwaveSafe" className="ml-2 block text-sm text-gray-700">
              Microwave Safe
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="dishwasherSafe"
              checked={specifications.dishwasherSafe || false}
              onChange={(e) => handleCheckboxChange('dishwasherSafe', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="dishwasherSafe" className="ml-2 block text-sm text-gray-700">
              Dishwasher Safe
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="foodGrade"
              checked={specifications.foodGrade || false}
              onChange={(e) => handleCheckboxChange('foodGrade', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="foodGrade" className="ml-2 block text-sm text-gray-700">
              Food Grade
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="bpaFree"
              checked={specifications.bpaFree || false}
              onChange={(e) => handleCheckboxChange('bpaFree', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="bpaFree" className="ml-2 block text-sm text-gray-700">
              BPA Free
            </label>
          </div>
        </div>
      </div>

      {/* General Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-800 mb-3">General Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
            <input
              type="text"
              value={specifications.countryOfOrigin || ''}
              onChange={(e) => handleSpecificationChange('countryOfOrigin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Made in India"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
            <input
              type="text"
              value={specifications.modelNumber || ''}
              onChange={(e) => handleSpecificationChange('modelNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ABC123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
            <input
              type="text"
              value={specifications.warranty || ''}
              onChange={(e) => handleSpecificationChange('warranty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1 year manufacturer warranty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
            <input
              type="text"
              value={specifications.occasion || ''}
              onChange={(e) => handleSpecificationChange('occasion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Casual, Formal, Party"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          value={specifications.notes || ''}
          onChange={(e) => handleSpecificationChange('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional product specifications..."
        />
      </div>
    </div>
  );
};

export default ProductSpecificationsForm;