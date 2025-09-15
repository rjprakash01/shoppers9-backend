import mongoose from 'mongoose';
import { ShippingProvider, ShippingRate } from '../models/Shipping';
import { connectDB } from '../config/database';

const seedShippingData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await ShippingProvider.deleteMany({});
    await ShippingRate.deleteMany({});
    console.log('Cleared existing shipping data');

    // Create shipping providers
    const providers = [
      {
        name: 'BlueDart Express',
        code: 'BLUEDART',
        description: 'Premium express delivery service across India',
        logo: 'https://example.com/bluedart-logo.png',
        contactInfo: {
          phone: '1800-233-1234',
          email: 'support@bluedart.com',
          website: 'https://www.bluedart.com',
          supportUrl: 'https://www.bluedart.com/support'
        },
        apiConfig: {
          baseUrl: 'https://api.bluedart.com',
          trackingUrl: 'https://www.bluedart.com/tracking'
        },
        capabilities: {
          tracking: true,
          realTimeRates: false,
          pickupScheduling: true,
          insurance: true,
          codSupport: true
        },
        serviceAreas: [
          {
            name: 'Metro Cities',
            pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
            isActive: true
          },
          {
            name: 'Tier 1 Cities',
            pincodes: ['411001', '380001', '302001', '226001', '160001'],
            isActive: true
          }
        ],
        isActive: true,
        priority: 10
      },
      {
        name: 'DTDC Courier',
        code: 'DTDC',
        description: 'Reliable domestic and international courier services',
        logo: 'https://example.com/dtdc-logo.png',
        contactInfo: {
          phone: '1800-123-3434',
          email: 'customercare@dtdc.com',
          website: 'https://www.dtdc.in',
          supportUrl: 'https://www.dtdc.in/support'
        },
        apiConfig: {
          baseUrl: 'https://api.dtdc.in',
          trackingUrl: 'https://www.dtdc.in/tracking'
        },
        capabilities: {
          tracking: true,
          realTimeRates: false,
          pickupScheduling: true,
          insurance: false,
          codSupport: true
        },
        serviceAreas: [
          {
            name: 'All India',
            pincodes: ['110001', '400001', '560001', '600001', '700001', '500001', '411001', '380001', '302001', '226001', '160001'],
            isActive: true
          }
        ],
        isActive: true,
        priority: 8
      },
      {
        name: 'India Post',
        code: 'INDIAPOST',
        description: 'Government postal service with nationwide coverage',
        logo: 'https://example.com/indiapost-logo.png',
        contactInfo: {
          phone: '1800-266-6868',
          email: 'support@indiapost.gov.in',
          website: 'https://www.indiapost.gov.in',
          supportUrl: 'https://www.indiapost.gov.in/support'
        },
        apiConfig: {
          baseUrl: 'https://api.indiapost.gov.in',
          trackingUrl: 'https://www.indiapost.gov.in/tracking'
        },
        capabilities: {
          tracking: true,
          realTimeRates: false,
          pickupScheduling: false,
          insurance: true,
          codSupport: true
        },
        serviceAreas: [
          {
            name: 'Pan India',
            pincodes: ['110001', '400001', '560001', '600001', '700001', '500001', '411001', '380001', '302001', '226001', '160001'],
            isActive: true
          }
        ],
        isActive: true,
        priority: 5
      },
      {
        name: 'Delhivery',
        code: 'DELHIVERY',
        description: 'Technology-enabled logistics and supply chain services',
        logo: 'https://example.com/delhivery-logo.png',
        contactInfo: {
          phone: '1800-419-4343',
          email: 'care@delhivery.com',
          website: 'https://www.delhivery.com',
          supportUrl: 'https://www.delhivery.com/support'
        },
        apiConfig: {
          baseUrl: 'https://api.delhivery.com',
          trackingUrl: 'https://www.delhivery.com/tracking'
        },
        capabilities: {
          tracking: true,
          realTimeRates: true,
          pickupScheduling: true,
          insurance: true,
          codSupport: true
        },
        serviceAreas: [
          {
            name: 'Express Delivery Zones',
            pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
            isActive: true
          }
        ],
        isActive: true,
        priority: 9
      }
    ];

    const createdProviders = await ShippingProvider.insertMany(providers);
    console.log(`Created ${createdProviders.length} shipping providers`);

    // Create shipping rates for each provider
    const rates = [];

    // BlueDart rates
    const bluedartProvider = createdProviders.find(p => p.code === 'BLUEDART');
    if (bluedartProvider) {
      rates.push(
        {
          providerId: bluedartProvider._id,
          name: 'BlueDart Standard',
          description: 'Standard delivery within 3-5 business days',
          serviceType: 'standard',
          deliveryTime: { min: 3, max: 5 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 50,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 50 },
              { minWeight: 0.5, maxWeight: 1, rate: 70 },
              { minWeight: 1, maxWeight: 2, rate: 90 },
              { minWeight: 2, maxWeight: 5, rate: 120 },
              { minWeight: 5, maxWeight: 10, rate: 180 }
            ]
          },
          zones: [
            {
              name: 'Metro',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
              multiplier: 1
            },
            {
              name: 'Tier 1',
              pincodes: ['411001', '380001', '302001', '226001', '160001'],
              multiplier: 1.2
            }
          ],
          freeShippingThreshold: 999,
          maxWeight: 10,
          maxValue: 50000,
          isActive: true
        },
        {
          providerId: bluedartProvider._id,
          name: 'BlueDart Express',
          description: 'Express delivery within 1-2 business days',
          serviceType: 'express',
          deliveryTime: { min: 1, max: 2 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 80,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 80 },
              { minWeight: 0.5, maxWeight: 1, rate: 110 },
              { minWeight: 1, maxWeight: 2, rate: 140 },
              { minWeight: 2, maxWeight: 5, rate: 200 },
              { minWeight: 5, maxWeight: 10, rate: 280 }
            ]
          },
          zones: [
            {
              name: 'Metro',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
              multiplier: 1
            }
          ],
          freeShippingThreshold: 1499,
          maxWeight: 10,
          maxValue: 100000,
          isActive: true
        }
      );
    }

    // DTDC rates
    const dtdcProvider = createdProviders.find(p => p.code === 'DTDC');
    if (dtdcProvider) {
      rates.push(
        {
          providerId: dtdcProvider._id,
          name: 'DTDC Standard',
          description: 'Standard delivery within 4-6 business days',
          serviceType: 'standard',
          deliveryTime: { min: 4, max: 6 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 40,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 40 },
              { minWeight: 0.5, maxWeight: 1, rate: 55 },
              { minWeight: 1, maxWeight: 2, rate: 70 },
              { minWeight: 2, maxWeight: 5, rate: 95 },
              { minWeight: 5, maxWeight: 10, rate: 140 }
            ]
          },
          zones: [
            {
              name: 'All India',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001', '411001', '380001', '302001', '226001', '160001'],
              multiplier: 1
            }
          ],
          freeShippingThreshold: 799,
          maxWeight: 10,
          maxValue: 25000,
          isActive: true
        }
      );
    }

    // India Post rates
    const indiaPostProvider = createdProviders.find(p => p.code === 'INDIAPOST');
    if (indiaPostProvider) {
      rates.push(
        {
          providerId: indiaPostProvider._id,
          name: 'India Post Standard',
          description: 'Standard postal delivery within 5-8 business days',
          serviceType: 'standard',
          deliveryTime: { min: 5, max: 8 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 25,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 25 },
              { minWeight: 0.5, maxWeight: 1, rate: 35 },
              { minWeight: 1, maxWeight: 2, rate: 45 },
              { minWeight: 2, maxWeight: 5, rate: 65 },
              { minWeight: 5, maxWeight: 10, rate: 95 }
            ]
          },
          zones: [
            {
              name: 'Pan India',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001', '411001', '380001', '302001', '226001', '160001'],
              multiplier: 1
            }
          ],
          freeShippingThreshold: 599,
          maxWeight: 10,
          maxValue: 15000,
          isActive: true
        }
      );
    }

    // Delhivery rates
    const delhiveryProvider = createdProviders.find(p => p.code === 'DELHIVERY');
    if (delhiveryProvider) {
      rates.push(
        {
          providerId: delhiveryProvider._id,
          name: 'Delhivery Standard',
          description: 'Standard delivery within 3-4 business days',
          serviceType: 'standard',
          deliveryTime: { min: 3, max: 4 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 45,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 45 },
              { minWeight: 0.5, maxWeight: 1, rate: 60 },
              { minWeight: 1, maxWeight: 2, rate: 80 },
              { minWeight: 2, maxWeight: 5, rate: 110 },
              { minWeight: 5, maxWeight: 10, rate: 160 }
            ]
          },
          zones: [
            {
              name: 'Express Zones',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
              multiplier: 1
            }
          ],
          freeShippingThreshold: 899,
          maxWeight: 10,
          maxValue: 75000,
          isActive: true
        },
        {
          providerId: delhiveryProvider._id,
          name: 'Delhivery Express',
          description: 'Express delivery within 1-2 business days',
          serviceType: 'express',
          deliveryTime: { min: 1, max: 2 },
          rateStructure: {
            type: 'weight_based',
            baseRate: 75,
            weightRanges: [
              { minWeight: 0, maxWeight: 0.5, rate: 75 },
              { minWeight: 0.5, maxWeight: 1, rate: 100 },
              { minWeight: 1, maxWeight: 2, rate: 130 },
              { minWeight: 2, maxWeight: 5, rate: 180 },
              { minWeight: 5, maxWeight: 10, rate: 250 }
            ]
          },
          zones: [
            {
              name: 'Express Zones',
              pincodes: ['110001', '400001', '560001', '600001', '700001', '500001'],
              multiplier: 1
            }
          ],
          freeShippingThreshold: 1299,
          maxWeight: 10,
          maxValue: 100000,
          isActive: true
        }
      );
    }

    const createdRates = await ShippingRate.insertMany(rates);
    console.log(`Created ${createdRates.length} shipping rates`);

    console.log('\n=== Shipping Data Seeded Successfully ===');
    console.log(`Providers: ${createdProviders.length}`);
    console.log(`Rates: ${createdRates.length}`);
    console.log('\nProviders created:');
    createdProviders.forEach(provider => {
      console.log(`- ${provider.name} (${provider.code})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding shipping data:', error);
    process.exit(1);
  }
};

// Run the seeding script
seedShippingData();