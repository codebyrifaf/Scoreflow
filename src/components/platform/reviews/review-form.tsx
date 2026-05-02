'use client';

import { useMemo, useState } from 'react';

type AgencyOption = {
  id: string;
  name: string;
};

type BusinessOption = {
  id: string;
  name: string;
  agencyId: string;
};

type LocationOption = {
  id: string;
  name: string;
  businessId: string;
  agencyId: string;
};

type ReviewFormProps = {
  agencies: AgencyOption[];
  businesses: BusinessOption[];
  locations: LocationOption[];
  action: (formData: FormData) => void;
};

export default function ReviewForm({
  agencies,
  businesses,
  locations,
  action,
}: ReviewFormProps) {
  const [agencyId, setAgencyId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [locationId, setLocationId] = useState('');

  const filteredBusinesses = useMemo(() => {
    if (!agencyId) return businesses;
    return businesses.filter((business) => business.agencyId === agencyId);
  }, [agencyId, businesses]);

  const filteredLocations = useMemo(() => {
    if (businessId) {
      return locations.filter((location) => location.businessId === businessId);
    }
    if (agencyId) {
      return locations.filter((location) => location.agencyId === agencyId);
    }
    return locations;
  }, [agencyId, businessId, locations]);

  return (
    <form action={action} className="space-y-6 rounded-xl border bg-white p-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="agency_id">
          Agency
        </label>
        <select
          id="agency_id"
          name="agency_id"
          className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
          value={agencyId}
          onChange={(event) => {
            const nextAgencyId = event.target.value;
            setAgencyId(nextAgencyId);
            setBusinessId('');
            setLocationId('');
          }}
          required
        >
          <option value="">Select an agency</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.id}>
              {agency.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="business_id"
        >
          Business
        </label>
        <select
          id="business_id"
          name="business_id"
          className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
          value={businessId}
          onChange={(event) => {
            const nextBusinessId = event.target.value;
            setBusinessId(nextBusinessId);
            setLocationId('');
          }}
          required
        >
          <option value="">Select a business</option>
          {filteredBusinesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700"
          htmlFor="location_id"
        >
          Location
        </label>
        <select
          id="location_id"
          name="location_id"
          className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          required
        >
          <option value="">Select a location</option>
          {filteredLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="rating">
          Rating (1-5)
        </label>
        <select
          id="rating"
          name="rating"
          className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
          required
        >
          <option value="">Select rating</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="comment">
          Comment
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Share the customer feedback"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="reset"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => {
            setAgencyId('');
            setBusinessId('');
            setLocationId('');
          }}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create review
        </button>
      </div>
    </form>
  );
}
