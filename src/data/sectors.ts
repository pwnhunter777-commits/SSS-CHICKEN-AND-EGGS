import { SectorItem } from '../types';

export const SECTORS: SectorItem[] = [
  {
    id: 'investment',
    title: 'Investment',
    description: 'Commercial broiler facilities, contract farming capital, and quarterly yields.',
    badge: 'Capital & Yields',
    overview: 'Direct investment opportunities in modern climate-controlled poultry housing, biosecurity infrastructure, and automated feed distribution systems.',
    keyDetails: [
      { label: 'Minimum Allocation', value: '$25,000' },
      { label: 'Projected Annual Return', value: '14.2% - 17.5%' },
      { label: 'Contract Cycle', value: '18 Months' },
      { label: 'Asset Backing', value: 'Insured Flock & Facilities' },
    ],
  },
  {
    id: 'wholesale',
    title: 'Wholesale',
    description: 'Bulk live bird distribution, commercial hatchery supply, and B2B orders.',
    badge: 'Bulk Supply',
    overview: 'High-volume poultry distribution servicing regional processors, institutional food distributors, commercial hatcheries, and supermarket chains.',
    keyDetails: [
      { label: 'Minimum Order', value: '500 Live Birds / 1,000 kg' },
      { label: 'Fulfillment Lead Time', value: '24 - 48 Hours' },
      { label: 'Standard Delivery', value: 'Refrigerated Fleet Fleet-Tracked' },
      { label: 'Payment Terms', value: 'Net 15 / Commercial Credit' },
    ],
  },
  {
    id: 'retail',
    title: 'Retail',
    description: 'Farm-fresh dressed poultry cuts, certified organic eggs, and store delivery.',
    badge: 'Direct to Store',
    overview: 'Premium grade dressed poultry, portioned vacuum cuts, and daily collected certified free-range eggs for local markets, grocers, and restaurants.',
    keyDetails: [
      { label: 'Product Range', value: 'Whole, Boneless, Cuts & Eggs' },
      { label: 'Packaging', value: 'Vacuum Sealed / Gas-Flushed' },
      { label: 'Daily Cut-off', value: '4:00 PM for Morning Delivery' },
      { label: 'Quality Standard', value: 'HACCP & Halal Certified' },
    ],
  },
];
